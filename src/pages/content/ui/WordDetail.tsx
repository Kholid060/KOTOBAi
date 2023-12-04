import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../content-handler/ContentHandler';
import { useRef, useState } from 'react';
import WordPopover, { WordPopoverRef } from './WordPopover';
import { WordFrameSource } from '@root/src/utils/RuntimeMessage';
import { ClientRect } from '@root/src/interface/shared.interface';

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

function WordDetail() {
  const popoverRef = useRef<WordPopoverRef | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffectOnce(() => {
    contentEventEmitter.on('search-word-result', (result) => {
      const popover = popoverRef.current;
      if (!result || !popover) {
        setIsOpen(false);
        return;
      }

      setIsOpen(true);

      const { rect, point, frameSource } = result;
      popover.refs.setPositionReference({
        getBoundingClientRect() {
          if (frameSource) {
            const frameRect = getFrameRect(frameSource);
            if (frameRect) return frameRect;
          }

          if (!rect) {
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
      className="bg-zinc-900"
      onOpenChange={setIsOpen}
    >
      <div>haha</div>
    </WordPopover>
  );
}

export default WordDetail;
