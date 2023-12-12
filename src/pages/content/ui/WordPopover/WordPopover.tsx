import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../../content-handler/ContentHandler';
import { useContext, useEffect, useRef, useState } from 'react';
import WordPopoverBase, { WordPopoverRef } from './WordPopoverBase';
import RuntimeMessage, {
  DisableExtPayload,
  WordFrameSource,
} from '@root/src/utils/RuntimeMessage';
import { ClientRect } from '@root/src/interface/shared.interface';
import { NodeTypeChecker } from '../../content-handler/content-handler-utils';
import { SearchDictWordResult } from '../../../background/messageHandler/dictWordSearcher';
import WordEntries from './WordEntries';
import { ChevronDown, PowerIcon, SettingsIcon, X } from 'lucide-react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import WordKanji from './WordKanji';
import { UiButton } from '@root/src/components/ui/button';
import UiTooltip from '@root/src/components/ui/tooltip';
import UiHoverCard from '@root/src/components/ui/hover-card';
import { AppContentContext } from '../app';

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

function WordPopover() {
  const appCtx = useContext(AppContentContext);

  const popoverRef = useRef<WordPopoverRef | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabItems>('words');
  const [searchResult, setSearchResult] = useState<SearchDictWordResult | null>(
    null,
  );
  const [tabDisabled, setTabDisabled] = useState<Record<TabItems, boolean>>({
    kanji: true,
    names: true,
    words: false,
  });

  function closePopup(clearResult = false) {
    setIsOpen(false);
    setSearchResult(null);

    if (clearResult) contentEventEmitter.emit('clear-result');
  }
  function disableExtension(payload: DisableExtPayload) {
    closePopup();
    RuntimeMessage.sendMessage('background:disable-ext', payload).catch(
      console.error,
    );
  }

  useEffect(() => {
    setActiveTab('words');

    if (!popoverRef.current) return;
    popoverRef.current.elements.floating?.scrollTo({
      top: 0,
      left: 0,
    });
  }, [searchResult]);
  useEffect(() => {
    if (appCtx.isDisabled) closePopup();
  }, [appCtx.isDisabled]);
  useEffectOnce(() => {
    contentEventEmitter.on('search-word-result', (result) => {
      const popover = popoverRef.current;
      if (
        !result ||
        !popover ||
        !result.entry ||
        result.entry.entries.length <= 0
      ) {
        closePopup();
        return;
      }

      setIsOpen(true);

      const { rect, point, frameSource, cursorOffset, entry } = result;

      setSearchResult(entry);

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
    });
  });

  return (
    <WordPopoverBase
      ref={popoverRef}
      isOpen={isOpen}
      placement="bottom-start"
      onOpenChange={setIsOpen}
      className="w-full z-[99999] max-w-sm bg-background border focus-visible:ring-2 shadow-xl text-sm rounded-md scroll max-h-96 overflow-auto"
    >
      {searchResult && (
        <>
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
            <UiButton variant="secondary" size="icon-xs" className="ml-1">
              <SettingsIcon className="h-4 w-4" />
            </UiButton>
            <div className="border rounded-md ml-2 h-8 flex items-center">
              <UiTooltip side="bottom" label="Disable extension">
                <UiButton
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-r-none"
                  onClick={() =>
                    disableExtension({ type: 'all', disable: true })
                  }
                >
                  <PowerIcon className="h-4 w-4" />
                </UiButton>
              </UiTooltip>
              <hr className="w-px bg-border h-4/5" />
              <UiHoverCard openDelay={100}>
                <UiHoverCard.Trigger>
                  <UiButton
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-l-none"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </UiButton>
                </UiHoverCard.Trigger>
                <UiHoverCard.Content align="end" className="p-2">
                  <UiButton
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() =>
                      disableExtension({
                        type: 'host',
                        disable: true,
                        host: window.location.hostname,
                      })
                    }
                  >
                    Disable only on this site
                  </UiButton>
                </UiHoverCard.Content>
              </UiHoverCard>
            </div>
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
            result={searchResult}
            className={activeTab === 'words' ? '' : 'hidden'}
          />
          <WordKanji
            result={searchResult}
            onToggleDisable={(disable) =>
              setTabDisabled((prevState) => ({ ...prevState, kanji: disable }))
            }
            className={activeTab === 'kanji' ? '' : 'hidden'}
          />
        </>
      )}
    </WordPopoverBase>
  );
}

export default WordPopover;
