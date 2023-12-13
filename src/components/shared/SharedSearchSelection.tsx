import { debounce } from '@root/src/utils/helper';
import { SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { UiButton } from '../ui/button';
import { createPortal } from 'react-dom';
import { isJapanese } from 'wanakana';

interface SharedSearchSelectionProps {
  portalEl?: Element;
  shadowRoot?: ShadowRoot;
  onSearch?: (text: string) => void;
}

const MAX_STR_LEN = 17;
const CONTAINER_HEIGHT = 42;

function SharedSearchSelection({
  onSearch,
  portalEl,
  shadowRoot,
}: SharedSearchSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function clearState() {
    setText('');
    setIsOpen(false);
    setPosition({ x: 0, y: 0 });
  }

  useEffect(() => {
    const onSelectionChange = debounce(() => {
      const selection = shadowRoot?.getSelection
        ? shadowRoot.getSelection()
        : window.getSelection();
      if (
        !selection ||
        selection.anchorOffset === selection.focusOffset ||
        selection.rangeCount < 1
      ) {
        clearState();
        return;
      }

      const selectiontext = selection.toString().slice(0, MAX_STR_LEN);
      if (!isJapanese(selectiontext)) {
        clearState();
        return;
      }
      setText(selectiontext);

      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      setPosition({
        x: rangeRect.left,
        y: rangeRect.top - CONTAINER_HEIGHT - 5,
      });

      console.log(selection, range, rangeRect);

      setIsOpen(true);
    }, 500);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      clearState();
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [shadowRoot, onSearch]);

  if (!isOpen) return;

  return createPortal(
    <div
      className="p-1 fixed top-0 left-0 bg-popover rounded-md text-sm border shadow-xl pointer-events-auto"
      style={{
        zIndex: 99999,
        height: CONTAINER_HEIGHT,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      ref={containerRef}
    >
      <UiButton
        variant="ghost"
        size="xs"
        onClick={() => {
          onSearch?.(text);
          clearState();
        }}
      >
        <SearchIcon className="h-5 w-5" />
        <span className="ml-2">
          Search <span className="font-sans-jp">{`"${text}"`}</span>
        </span>
      </UiButton>
    </div>,
    portalEl || document.body,
  );
}

export default SharedSearchSelection;
