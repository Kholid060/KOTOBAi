import { useEffectOnce } from 'usehooks-ts';
import {
  ContentSearchWordResult,
  contentEventEmitter,
} from '../../content-handler/ContentHandler';
import { useContext, useEffect, useRef, useState } from 'react';
import WordPopoverBase, { WordPopoverRef } from './WordPopoverBase';
import RuntimeMessage, {
  WordFrameSource,
} from '@root/src/utils/RuntimeMessage';
import { ClientRect } from '@root/src/interface/shared.interface';
import { NodeTypeChecker } from '../../content-handler/content-handler-utils';
import { DictionaryWordEntryResult } from '../../../background/messageHandler/dictWordSearcher';
import WordEntries from './WordEntries';
import { SettingsIcon, X } from 'lucide-react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import WordKanji from './WordKanji';
import { UiButton } from '@root/src/components/ui/button';
import { AppContentContext } from '../app';
import WordNames from './WordNames';
import { isKanji } from 'wanakana';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';

type TabItems = 'words' | 'kanji' | 'names';
const TAB_ITEMS: { name: string; id: TabItems }[] = [
  { name: 'Words', id: 'words' },
  { name: 'Kanji', id: 'kanji' },
  { name: 'Names', id: 'names' },
];

function getFrameRect({
  frameURL,
  point,
  rect,
}: WordFrameSource): ClientRect | null {
  let frameRect = rect;
  if (!frameRect) {
    const frameEl = document.querySelector<HTMLIFrameElement>(
      `frame[src="${frameURL}"]`,
    );
    if (!frameEl) return null;

    frameRect = frameEl.getBoundingClientRect();
  }

  const top = point.y;
  const left = point.x;
  const right = frameRect.left + point.x;
  const bottom = frameRect.top + point.y;

  return {
    top,
    left,
    right,
    bottom,
    y: top,
    x: left,
    width: right - left,
    height: bottom - top,
  };
}

async function fetchKanji(
  text: string,
  maxLength: number,
): Promise<DictKanjiEntry[]> {
  if (!text.trim()) return [];

  const kanji = text
    .slice(0, maxLength)
    .split('')
    .reduce<Set<number>>((acc, char) => {
      if (isKanji(char)) {
        const kanjiCodePoint = char.codePointAt(0);
        if (kanjiCodePoint) acc.add(kanjiCodePoint);
      }

      return acc;
    }, new Set());
  if (kanji.size === 0) return [];

  try {
    return await RuntimeMessage.sendMessage('background:search-kanji', {
      by: 'id',
      maxResult: 10,
      input: [...kanji],
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}
async function fetchWords(input: string) {
  try {
    return await RuntimeMessage.sendMessage('background:search-name', {
      input,
      maxResult: 10,
      maxQueryLimit: 2,
      type: 'search-backward',
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

const tabDisabledDef: Record<TabItems, boolean> = {
  kanji: true,
  names: true,
  words: false,
};

function WordPopover() {
  const appCtx = useContext(AppContentContext);

  const popoverRef = useRef<WordPopoverRef | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const [dictEntries, setDictEntries] = useState<{
    kanji: DictKanjiEntry[];
    names: DictionaryNameEntryResult[];
    words: DictionaryWordEntryResult[];
  }>({
    words: [],
    kanji: [],
    names: [],
  });

  const [activeTab, setActiveTab] = useState<TabItems>('words');
  const [tabDisabled, setTabDisabled] = useState(() => ({ ...tabDisabledDef }));

  function closePopup(clearResult = false) {
    setIsOpen(false);
    if (clearResult) contentEventEmitter.emit('clear-result');
  }

  useEffect(() => {
    if (appCtx.isDisabled) closePopup();
  }, [appCtx.isDisabled]);
  useEffectOnce(() => {
    const onSearchResult = async (result: ContentSearchWordResult | null) => {
      try {
        const popover = popoverRef.current;
        if (!result || !popover) {
          closePopup();
          return;
        }

        const { rect, point, frameSource, cursorOffset, entry } = result;

        const [kanji, names] = await Promise.all([
          fetchKanji(entry.input, entry.maxLength),
          fetchWords(entry.input),
        ]);

        const dictEntriesResult: typeof dictEntries = {
          names,
          kanji,
          words: entry.entries ?? [],
        };

        const noResult = Object.values(dictEntriesResult).every(
          (entries) => entries.length === 0,
        );
        if (noResult) {
          closePopup();
          return;
        }

        setDictEntries(dictEntriesResult);

        let defActiveTab: TabItems = 'words';
        if (entry.entries.length === 0 && kanji.length > 0) {
          defActiveTab = 'kanji';
        } else if (
          entry.entries.length === 0 &&
          kanji.length === 0 &&
          names.length > 0
        ) {
          defActiveTab = 'names';
        }

        setActiveTab(defActiveTab);
        setTabDisabled({
          kanji: kanji.length === 0,
          names: names.length === 0,
          words: entry.entries.length === 0,
        });

        setIsOpen(true);

        popover.refs.setPositionReference({
          getBoundingClientRect() {
            if (frameSource) {
              const frameRect = getFrameRect(frameSource);
              if (frameRect) return frameRect;
            }

            if (
              !rect ||
              (cursorOffset &&
                (NodeTypeChecker.isInput(cursorOffset.offsetNode) ||
                  NodeTypeChecker.isImage(cursorOffset.offsetNode)))
            ) {
              return {
                width: 0,
                height: 0,
                x: point.x,
                y: point.y,
                top: point.y,
                left: point.x,
                right: point.x,
                bottom: point.y,
              };
            }

            return rect;
          },
        });
      } catch (error) {
        console.error(error);
      }
    };
    contentEventEmitter.on('search-word-result', onSearchResult);

    return () => {
      contentEventEmitter.removeListener('search-word-result', onSearchResult);
    };
  });

  return (
    <WordPopoverBase
      ref={popoverRef}
      isOpen={isOpen}
      placement="bottom-start"
      onOpenChange={setIsOpen}
      className="w-full z-[99999] max-w-sm bg-background border focus-visible:ring-2 shadow-xl text-sm rounded-md scroll max-h-96 overflow-auto"
    >
      <div className="flex items-center px-4 z-50 border-b bg-background sticky top-0">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            className={cn(
              'p-2 py-3 border-b h-full hover:text-foreground',
              activeTab === item.id
                ? 'border-primary'
                : 'border-transparent text-muted-foreground',
              tabDisabled[item.id] && 'hidden',
            )}
            disabled={tabDisabled[item.id]}
            onClick={() => !tabDisabled[item.id] && setActiveTab(item.id)}
          >
            {item.name}
          </button>
        ))}
        <div className="flex-grow" />
        <UiButton
          variant="secondary"
          size="icon-xs"
          className="ml-1"
          onClick={() =>
            RuntimeMessage.sendMessage('background:dashboard-open', '/settings')
          }
        >
          <SettingsIcon className="h-4 w-4" />
        </UiButton>
        <button
          onPointerDown={(event) => {
            event.preventDefault();
            closePopup(true);
          }}
          className="ml-4"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <WordEntries
        entries={dictEntries.words}
        className={activeTab === 'words' ? '' : 'hidden'}
      />
      <WordKanji
        entries={dictEntries.kanji}
        className={activeTab === 'kanji' ? '' : 'hidden'}
      />
      <WordNames
        entries={dictEntries.names}
        className={activeTab === 'names' ? '' : 'hidden'}
      />
    </WordPopoverBase>
  );
}

export default WordPopover;
