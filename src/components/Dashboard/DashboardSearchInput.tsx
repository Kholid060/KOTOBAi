import { Loader2Icon, SearchIcon } from 'lucide-react';
import { UiButton } from '../ui/button';
import { useEffect, useRef, useState } from 'react';
import searchDictEntries, {
  DictQueryResult,
  dictQueryTypeSymbol,
} from '@root/src/utils/searchDictEntries';
import { toKana } from 'wanakana';
import UiCommand from '../ui/command';
import UiToggle from '../ui/toggle';
import UiTooltip from '../ui/tooltip';
import { useDebounce, useOnClickOutside } from 'usehooks-ts';
import { sleep } from '@root/src/utils/helper';
import SharedDictSearchList from '../shared/SharedDictSearchList';
import { useNavigate, useSearchParams } from 'react-router-dom';

const searchFilters = [
  { name: 'Words', symbol: '#' },
  { name: 'Kanji', symbol: '>' },
  { name: 'Names', symbol: '@' },
];

function DashboardSearchInput() {
  const firstInit = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const [searchParamss, setSearchParams] = useSearchParams({ query: '' });

  const [isOpen, setIsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(() => searchParamss.get('query'));
  const [searchResult, setSearchResult] = useState<DictQueryResult | null>(
    null,
  );

  const [imeInput, setImeInput] = useState(true);

  const debouncedQuery = useDebounce(query, 500);

  function appendFilter(symbol: string) {
    const querySymbols = Object.keys(dictQueryTypeSymbol);
    setQuery(
      symbol + (querySymbols.includes(query[0]) ? query.slice(1) : query),
    );
  }
  function onInputChange(value: string) {
    setQuery(
      imeInput ? toKana(value, { IMEMode: true, passRomaji: true }) : value,
    );
  }

  useOnClickOutside(containerRef, () => {
    setIsOpen(false);
  });

  useEffect(() => {
    (async () => {
      try {
        const trimmedQuery = debouncedQuery.trim();

        setSearchParams((prevState) => {
          if (!trimmedQuery) prevState.delete('query');
          else prevState.set('query', trimmedQuery);

          return prevState;
        });

        if (trimmedQuery) setIsLoading(true);

        const result = await searchDictEntries(trimmedQuery);

        setSearchResult(result);

        if (firstInit.current && !result) return;
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      } finally {
        firstInit.current = false;

        await sleep(500);
        setIsLoading(false);
      }
    })();

    return () => {
      setSearchResult(null);
    };
  }, [debouncedQuery]);

  return (
    <>
      <UiCommand
        ref={containerRef}
        shouldFilter={false}
        className="relative z-50 overflow-visible"
      >
        <UiCommand.Input
          value={query}
          onValueChange={onInputChange}
          wrapperClass="border rounded-lg"
          placeholder="Search words, kanji, or names"
          prependSlot={
            isLoading ? (
              <Loader2Icon className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            )
          }
          className="font-sans-jp placeholder:font-sans pl-2 h-12 focus:outline-none text-base"
          onClick={() => setIsOpen(true)}
          onKeyDown={({ code, shiftKey, ctrlKey, metaKey }) => {
            if (shiftKey || ctrlKey || metaKey || code !== 'Escape') return;

            setIsOpen(false);
          }}
        />
        {isOpen && query && (
          <UiCommand.List
            className="absolute w-full max-h-80 bg-popover pt-1 rounded-lg shadow-xl border top-14 z-50"
            style={{
              minHeight: '150px',
              height: 'var(--cmdk-list-height)',
              transition: 'height 250ms ease',
            }}
          >
            <UiCommand.Empty>No results found.</UiCommand.Empty>
            {searchResult && (
              <SharedDictSearchList
                query={query}
                result={searchResult}
                onSelect={({ id, type }) => navigate(`/${type}/${id}`)}
              />
            )}
          </UiCommand.List>
        )}
      </UiCommand>
      <div className="flex items-center mt-2 px-2 text-sm text-muted-foreground">
        <p>Filter by</p>
        {searchFilters.map((filter) => (
          <UiButton
            key={filter.symbol}
            size="xs"
            variant="secondary"
            className="text-sm ml-2"
            onClick={() => appendFilter(filter.symbol)}
          >
            {filter.symbol + filter.name}
          </UiButton>
        ))}
        <div className="flex-grow" />
        <UiTooltip label="Auto convert romaji into hiragana">
          <div>
            <UiToggle
              size="xs"
              pressed={imeInput}
              className="text-sm"
              onPressedChange={setImeInput}
            >
              <span>A</span> <span>{'=>'}</span>
              <span className="font-sans-jp inline-block">あ</span>
            </UiToggle>
          </div>
        </UiTooltip>
      </div>
    </>
  );
}

export default DashboardSearchInput;
