import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../content-handler/ContentHandler';
import { useRef, useState } from 'react';
import WordPopover, { WordPopoverRef } from './WordPopover';
import { WordFrameSource } from '@root/src/utils/RuntimeMessage';
import { ClientRect } from '@root/src/interface/shared.interface';
import { NodeTypeChecker } from '../content-handler/content-handler-utils';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import WordEntries from './WordEntries';
import { X } from 'lucide-react';
import { cn } from '@root/src/shared/lib/shadcn-utils';

const TAB_ITEMS = [
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

function WordContainerHeader() {
  const [activeTab, setActiveTab] = useState('words');

  return (
    <div className="flex items-center px-4 border-b bg-background sticky top-0">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.id}
          className={cn(
            'p-2 py-3 border-b h-full hover:text-foreground',
            activeTab === item.id
              ? 'border-primary'
              : 'border-transparent text-muted-foreground',
          )}
          onClick={() => setActiveTab(item.id)}
        >
          {item.name}
        </button>
      ))}
      <div className="flex-grow" />
      <button>
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function WordContainer() {
  const popoverRef = useRef<WordPopoverRef | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchDictWordResult | null>(
    null,
  );

  useEffectOnce(() => {
    contentEventEmitter.on('search-word-result', (result) => {
      const popover = popoverRef.current;
      if (!result || !popover) {
        // setIsOpen(false);
        // setSearchResult(null);
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

    if (window.location.host === 'localhost:3000') {
      setTimeout(() => {
        document.documentElement.dispatchEvent(
          new PointerEvent('pointermove', {
            clientY: 73,
            bubbles: true,
            clientX: 90.5,
          }),
        );
      }, 500);
    }

    return () => {
      contentEventEmitter.removeAllListeners();
    };
  });

  return (
    <WordPopover
      ref={popoverRef}
      isOpen={isOpen}
      placement="bottom-start"
      onOpenChange={setIsOpen}
      className="w-full max-w-sm bg-background border focus-visible:ring-2 shadow-xl text-sm rounded-md scroll max-h-96 overflow-auto"
    >
      {searchResult && (
        <>
          <WordContainerHeader />
          <div className="p-4">
            <WordEntries result={searchResult} />
          </div>
        </>
      )}
    </WordPopover>
  );
}

export default WordContainer;
