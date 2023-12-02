import { useEffectOnce } from 'usehooks-ts';
import ContentHandler from '../content-handler/ContentHandler';
import { useRef, useState } from 'react';
import WordPopover, { WordPopoverRef } from './WordPopover';
import { NodeTypeChecker } from '../content-handler/content-handler-utils';

function WordDetail() {
  const popoverRef = useRef<WordPopoverRef | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffectOnce(() => {
    const contentHandler = new ContentHandler();
    contentHandler.on('search-word-result', (result) => {
      const popover = popoverRef.current;
      if (!result || !popover) {
        setIsOpen(false);
        return;
      }

      setIsOpen(true);

      const { rect, point, cursorOffset } = result;
      popover.refs.setPositionReference({
        getBoundingClientRect() {
          if (
            NodeTypeChecker.isImage(cursorOffset.offsetNode) ||
            NodeTypeChecker.isInput(cursorOffset.offsetNode)
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
      contentHandler.destroy();
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
