import { useDebounce, useEventListener, useUpdateEffect } from 'usehooks-ts';
import UiCommand from '@root/src/components/ui/command';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { AppContentContext } from '../app';
import { sleep } from '@root/src/utils/helper';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { isKanji, toHiragana } from 'wanakana';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  Loader2Icon,
  SearchIcon,
} from 'lucide-react';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import CommandContent, { CommandContentRef } from './CommandContent';
import UiSeparator from '@root/src/components/ui/separator';
import UiToggle from '@root/src/components/ui/toggle';
import UiTooltip from '@root/src/components/ui/tooltip';
import SharedSearchSelection from '@root/src/components/shared/SharedSearchSelection';

export type CommandTabIds = 'all' | 'words' | 'kanji' | 'names';
export interface CommandQueryResult {
  kanji: DictKanjiEntry[];
  names: DictionaryNameEntryResult[];
  words: DictionaryWordEntryResult[];
}

const queryTypeSymbol = {
  '#': 'words',
  '＃': 'words',
  '>': 'kanji',
  '＞': 'kanji',
  '@': 'names',
  '＠': 'names',
};

export const getCommandQueryType = (str: string): CommandTabIds => {
  const { 0: firstChar } = str.trim();
  if (queryTypeSymbol[firstChar]) return queryTypeSymbol[firstChar];

  return 'all';
};

const queriesMap = {
  words: async (input: string) => {
    const result = await RuntimeMessage.sendMessage('background:search-word', {
      input,
      maxResult: 15,
      maxQueryLimit: 10,
      type: 'search-forward',
    });

    return result.entries;
  },
  kanji: async (input: string) => {
    const kanjiIds = input
      .trim()
      .split('')
      .reduce<Set<number>>((acc, char) => {
        if (isKanji(char)) {
          acc.add(char.codePointAt(0));
        }

        return acc;
      }, new Set());
    const result = await RuntimeMessage.sendMessage('background:search-kanji', {
      by: 'id',
      maxResult: 5,
      input: [...kanjiIds],
    });

    return result.filter(Boolean);
  },
  names: async (input: string) => {
    const result = await RuntimeMessage.sendMessage('background:search-name', {
      input,
      maxResult: 15,
      maxQueryLimit: 10,
      type: 'search-forward',
    });

    return result;
  },
};

const CommandInput = forwardRef<
  HTMLInputElement,
  {
    ime?: boolean;
    value?: string;
    isLoading?: boolean;
    onValueChange?: (str: string) => void;
  } & React.DetailsHTMLAttributes<HTMLInputElement>
>(({ value = '', isLoading, ime = false, onValueChange, ...props }, ref) => {
  const [realVal, setRealVal] = useState(() => value);

  const debounceValue = useDebounce(realVal, 300);

  function onInputValueChange(str: string) {
    let newVal = str;
    if (ime) newVal = toHiragana(newVal, { IMEMode: true });

    setRealVal(newVal);
  }

  useEffect(() => {
    onValueChange?.(debounceValue);
  }, [onValueChange, debounceValue]);
  useEffect(() => {
    setRealVal(value);
  }, [value]);

  return (
    <UiCommand.Input
      ref={ref}
      value={realVal}
      prependSlot={
        <div className="mr-2 shrink-0">
          {isLoading ? (
            <Loader2Icon className="h-4 w-4 animate-spin opacity-60" />
          ) : (
            <SearchIcon className="h-4 w-4 opacity-50" />
          )}
        </div>
      }
      onValueChange={onInputValueChange}
      className="font-sans-jp placeholder:font-sans"
      placeholder="Search words, kanji, or names (append > to only search kanji)"
      {...props}
    />
  );
});
CommandInput.displayName = 'CommandInput';

function CommandContainer() {
  const appCtx = useContext(AppContentContext);

  const inputRef = useRef<HTMLInputElement>(null);
  const commandContentRef = useRef<CommandContentRef | null>(null);

  const [query, setQuery] = useState('');
  const [imeInput, setImeInput] = useState(true);
  const [queryResult, setQueryResult] = useState<CommandQueryResult>({
    kanji: [],
    names: [],
    words: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function onInputKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.code !== 'Escape' || !commandContentRef.current?.activeItemDetail)
      return;

    commandContentRef.current.setActiveItem({ id: '', type: 'words' });
    event.stopPropagation();
  }

  useEventListener('keydown', (event) => {
    const { ctrlKey, altKey, code } = event;
    if (!ctrlKey || !altKey || code !== 'KeyA') return;

    event.preventDefault();
    setIsOpen(true);
  });

  useEffect(() => {
    if (appCtx.isDisabled) setIsOpen(false);
  }, [appCtx.isDisabled]);
  useEffect(() => {
    if (!isOpen) {
      setQueryResult({
        kanji: [],
        names: [],
        words: [],
      });
      setQuery('');
    }
  }, [isOpen]);
  useUpdateEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const result: CommandQueryResult = {
          kanji: [],
          words: [],
          names: [],
        };

        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
          setQueryResult(result);
          return;
        }

        const queryType = getCommandQueryType(query);
        if (queryType !== 'all' && trimmedQuery.length <= 1) return;

        if (queryType === 'all') {
          const [words, kanji, names] = await Promise.allSettled([
            queriesMap.words(trimmedQuery),
            queriesMap.kanji(trimmedQuery),
            queriesMap.names(trimmedQuery),
          ]);

          result.kanji = kanji.status === 'fulfilled' ? kanji.value : [];
          result.names = names.status === 'fulfilled' ? names.value : [];
          result.words = words.status === 'fulfilled' ? words.value : [];
        } else {
          // @ts-expect-error expected!!!
          result[queryType] = await queriesMap[queryType](
            trimmedQuery.slice(1),
          );
        }

        setQueryResult(result);
      } catch (error) {
        console.error(error);
      } finally {
        await sleep(500);
        setIsLoading(false);
      }
    })();
  }, [query]);

  return (
    <UiCommand.Dialog
      open={isOpen}
      shouldFilter={false}
      contentClass="max-w-2xl"
      onOpenChange={setIsOpen}
      contentProps={{
        onKeyDown: (event) => {
          event.stopPropagation();
        },
      }}
      container={appCtx.shadowRoot.firstElementChild as HTMLElement}
    >
      <div className="absolute top-0 left-0 -z-10 h-4/6 w-8/12 bg-gradient-to-br from-cyan-700/30 via-blue-700/30 dark:from-cyan-500/10 dark:via-blue-500/10 to-50% to-transparent"></div>
      <CommandInput
        value={query}
        ime={imeInput}
        ref={inputRef}
        isLoading={isLoading}
        onValueChange={setQuery}
        onKeyDownCapture={onInputKeydown}
      />
      <CommandContent
        query={query}
        ref={commandContentRef}
        queryResult={queryResult}
      >
        {query && <UiCommand.Empty>No results found.</UiCommand.Empty>}
      </CommandContent>
      <SharedSearchSelection
        onSearch={(query) => {
          setQuery(query);
          inputRef.current?.focus();
        }}
        shadowRoot={appCtx.shadowRoot}
        portalEl={appCtx.shadowRoot.firstElementChild}
      />
      <div className="py-2 px-4 gap-2 text-xs text-muted-foreground flex items-center border-t">
        <UiTooltip label="Auto convert romaji into kana" side="right">
          <div>
            <UiToggle
              size="xs"
              pressed={imeInput}
              className="text-sm h-7"
              onPressedChange={setImeInput}
            >
              <span>A</span> <span>{'=>'}</span>
              <span className="font-sans-jp inline-block">あ</span>
            </UiToggle>
          </div>
        </UiTooltip>
        <UiSeparator orientation="vertical" className="!mx-2" />
        <p>
          <kbd className="kbd mr-1">
            <CornerDownLeftIcon className="h-3 w-3 inline-block" />
          </kbd>
          <span>to select</span>
        </p>
        <p>
          <kbd className="kbd mr-1">
            <ArrowUpIcon className="h-3 w-3 inline-block" />
          </kbd>
          <kbd className="kbd mr-1">
            <ArrowDownIcon className="h-3 w-3 inline-block" />
          </kbd>
          <span>to navigate</span>
        </p>
        <p>
          <kbd className="kbd mr-1 text-sm">esc</kbd>
          <span>to close</span>
        </p>
        <div className="flex-grow"></div>
        <p className="space-x-1">
          <kbd className="kbd">Ctrl</kbd>
          <kbd className="kbd">Alt</kbd>
          <kbd className="kbd">A</kbd>
        </p>
      </div>
    </UiCommand.Dialog>
  );
}

export default CommandContainer;
