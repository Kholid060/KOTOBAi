import { useDebounce, useEffectOnce, useEventListener } from 'usehooks-ts';
import UiCommand from '@root/src/components/ui/command';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { AppContentContext } from '../app';
import { sleep } from '@root/src/utils/helper';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { isJapanese, toKana } from 'wanakana';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  Loader2Icon,
  SearchIcon,
} from 'lucide-react';
import CommandContent, { CommandContentRef } from './CommandContent';
import UiSeparator from '@root/src/components/ui/separator';
import UiToggle from '@root/src/components/ui/toggle';
import UiTooltip from '@root/src/components/ui/tooltip';
import SharedSearchSelection from '@root/src/components/shared/SharedSearchSelection';
import searchDictEntries, {
  DictQueryResult,
} from '@root/src/utils/searchDictEntries';

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
    if (ime) newVal = toKana(newVal, { IMEMode: true, passRomaji: true });

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

  const [query, setQuery] = useState(() => {
    const selection = window.getSelection()?.toString() ?? '';
    if (!selection.trim() || !isJapanese(selection)) return '';

    return selection;
  });
  const [imeInput, setImeInput] = useState(true);
  const [queryResult, setQueryResult] = useState<DictQueryResult>({
    kanji: [],
    names: [],
    words: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  function onInputKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.code !== 'Escape' || !commandContentRef.current?.activeItemDetail)
      return;

    commandContentRef.current.setActiveItem({ id: '', type: 'words' });
    event.stopPropagation();
  }

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);

        const result = await searchDictEntries(query);
        setQueryResult(result ? result : { kanji: [], names: [], words: [] });
      } catch (error) {
        console.error(error);
      } finally {
        await sleep(500);
        setIsLoading(false);
      }
    })();
  }, [query]);
  useEffectOnce(() => {
    return () => {
      setQueryResult({
        kanji: [],
        names: [],
        words: [],
      });
      setQuery('');
    };
  });

  return (
    <>
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
        shadowRoot={appCtx.shadowRoot ?? undefined}
        portalEl={appCtx.shadowRoot?.firstElementChild ?? undefined}
      />
      <div className="py-2 px-4 gap-2 text-xs text-muted-foreground flex items-center border-t">
        <UiTooltip label="Auto convert romaji into hiragana" side="right">
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
    </>
  );
}

function CommandContainerWrapper() {
  const appCtx = useContext(AppContentContext);

  const [isOpen, setIsOpen] = useState(false);

  useEffectOnce(() => {
    const onMessage = () => {
      setIsOpen(true);
    };
    RuntimeMessage.onMessage('content:open-search-command', onMessage);

    return () => {
      RuntimeMessage.removeListener('content:open-search-command');
    };
  });

  useEventListener(
    'keydown',
    (event) => {
      const { ctrlKey, altKey, code } = event;
      if (!ctrlKey || !altKey || code !== 'KeyA') return;

      event.preventDefault();
      setIsOpen(true);
    },
    undefined,
    { capture: true },
  );

  return (
    <UiCommand.Dialog
      open={isOpen}
      shouldFilter={false}
      contentClass="max-w-2xl"
      onOpenChange={setIsOpen}
      contentProps={{
        onKeyDown: (event) => {
          event.stopPropagation();

          const { ctrlKey, shiftKey, metaKey, code } = event;
          if (ctrlKey || shiftKey || metaKey || code !== 'Escape') return;

          setIsOpen(false);
        },
      }}
      container={appCtx.shadowRoot?.firstElementChild as HTMLElement}
    >
      <CommandContainer />
    </UiCommand.Dialog>
  );
}

export default CommandContainerWrapper;
