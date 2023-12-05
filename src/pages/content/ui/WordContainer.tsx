import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../content-handler/ContentHandler';
import { useRef, useState } from 'react';
import WordPopover, { WordPopoverRef } from './WordPopover';
import { WordFrameSource } from '@root/src/utils/RuntimeMessage';
import { ClientRect } from '@root/src/interface/shared.interface';
import { NodeTypeChecker } from '../content-handler/content-handler-utils';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import WordContent from './WordContent';

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

    return () => {
      contentEventEmitter.removeAllListeners();
    };
  });

  return (
    <WordPopover
      ref={popoverRef}
      isOpen={isOpen}
      placement="bottom-start"
      className="bg-zinc-900 text-zinc-200"
      onOpenChange={setIsOpen}
    >
      {searchResult && <WordContent result={searchResult} />}
    </WordPopover>
  );
}

export default WordContainer;
