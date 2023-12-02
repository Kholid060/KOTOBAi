import { NodeTypeChecker } from './content-handler-utils';
import { CursorOffsetText } from './get-cursor-text';

declare global {
  interface Highlight extends Set<StaticRange> {
    readonly priority: number;
  }

  // eslint-disable-next-line no-var
  var Highlight:
    | {
        prototype: Highlight;
        new (...initialRanges: Array<StaticRange>): Highlight;
      }
    | undefined;

  type HighlightRegistry = Map<string, Highlight>;

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace CSS {
    const highlights: HighlightRegistry | undefined;
  }
}

const STYLE_ID = 'ext-name';

function injectCSS() {
  const styleExists = document.getElementById(STYLE_ID);
  if (styleExists) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  ::highlight(${STYLE_ID}) {
    color: #e4e4e7;
    background-color: #0284c7;
  }
  `;

  document.head.appendChild(style);
}

interface HighlighterParam {
  matchLength: number;
  documentCtx: Document;
  cursorOffset: CursorOffsetText;
}

type PrevSelection =
  | null
  | {
      end: number;
      type: 'input';
      start: number;
      el: HTMLInputElement;
      dir: 'forward' | 'backward' | 'none';
    }
  | {
      end: number;
      type: 'node';
      start: number;
      endNode: Node;
      startNode: Node;
    };

class TextHighlighter {
  private selectedText: string;
  private prevSelection: PrevSelection;
  private highlightAPIAvailable: boolean;
  private prevFocusEl: Element | HTMLElement | null;

  constructor() {
    this.selectedText = '';
    this.prevFocusEl = null;
    this.prevSelection = null;
    this.highlightAPIAvailable = Boolean(window.Highlight && CSS.highlights);
  }

  highlighText({
    cursorOffset,
    matchLength,
  }: {
    matchLength: number;
    cursorOffset: CursorOffsetText;
  }) {
    const documentCtx = cursorOffset.offsetNode.ownerDocument;
    if (!documentCtx) return;

    this.storeCurrSelection();
    CSS?.highlights?.delete(STYLE_ID);

    const highlighterPayload = { cursorOffset, matchLength, documentCtx };

    if (NodeTypeChecker.isInput(cursorOffset.offsetNode)) {
      this.inputHighlighter(highlighterPayload);
    } else {
      this.nodeHighlighter(highlighterPayload);
    }
  }

  private inputHighlighter({ cursorOffset, matchLength }: HighlighterParam) {
    if (!this.prevFocusEl) this.prevFocusEl = document.activeElement;

    const el = cursorOffset.offsetNode as HTMLInputElement;
    const [textRange] = cursorOffset.textRange;

    const startOffset = textRange.start;
    const endOffset = textRange.start + matchLength;

    el.focus();
    el.setSelectionRange(startOffset, endOffset);

    this.selectedText = el.value.slice(startOffset, endOffset);
  }

  private nodeHighlighter({
    matchLength,
    documentCtx,
    cursorOffset,
  }: HighlighterParam) {
    const { textRange } = cursorOffset;
    const [firstRange] = textRange;
    if (!firstRange) return;

    const startNode = firstRange.node;
    const startOffset = firstRange.start;
    let endNode = startNode;
    let endOffset = firstRange.start + matchLength;

    let currentLength = 0;
    for (const item of textRange) {
      if (currentLength >= matchLength) break;

      const length = Math.min(
        item.end - item.start,
        matchLength - currentLength,
      );

      currentLength += length;

      endNode = item.node;
      endOffset = item.start + length;
    }

    if (!this.prevFocusEl) this.prevFocusEl = documentCtx.activeElement;

    if (this.highlightAPIAvailable) {
      const range = new StaticRange({
        endOffset,
        startOffset,
        endContainer: endNode,
        startContainer: startNode,
      });
      CSS.highlights.set(STYLE_ID, new Highlight(range));

      injectCSS();
    } else {
      const range = documentCtx.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      const selection = documentCtx.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      this.selectedText = selection.toString();
    }
  }

  private storeCurrSelection() {
    if (this.prevSelection) return;

    const isInputFocus = NodeTypeChecker.isInput(document.activeElement);
    if (isInputFocus) {
      const { selectionStart, selectionEnd, selectionDirection } =
        document.activeElement as HTMLInputElement;
      if (selectionStart === selectionEnd) return;

      this.prevSelection = {
        type: 'input',
        end: selectionEnd,
        start: selectionStart,
        dir: selectionDirection,
        el: document.activeElement as HTMLInputElement,
      };
      return;
    }

    const selection = window.getSelection();
    if (
      this.highlightAPIAvailable ||
      !selection ||
      selection.type !== 'Range' ||
      selection.toString() === this.selectedText
    )
      return;

    this.prevSelection = {
      type: 'node',
      end: selection.focusOffset,
      endNode: selection.focusNode,
      start: selection.anchorOffset,
      startNode: selection.anchorNode,
    };
  }

  private restorePrevSelection() {
    if (this.prevFocusEl && 'focus' in this.prevFocusEl) {
      this.prevFocusEl.focus();
    }

    if (!this.prevSelection) {
      if (!this.highlightAPIAvailable) {
        const selection = document.getSelection();
        selection.removeAllRanges();
      }

      return;
    }

    if (this.prevSelection.type === 'input') {
      const currentInput = <HTMLInputElement>document.activeElement;
      if (NodeTypeChecker.isInput(currentInput)) {
        currentInput.setSelectionRange(0, 0);
      }

      const { dir, el, end, start } = this.prevSelection;

      el.focus();
      el.setSelectionRange(start, end, dir);
    } else if (this.prevSelection.type === 'node') {
      const { end, start, endNode, startNode } = this.prevSelection;

      const range = new Range();
      range.setStart(endNode, end);
      range.setStart(startNode, start);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  clearHighlight() {
    this.restorePrevSelection();

    CSS?.highlights?.delete(STYLE_ID);

    this.selectedText = '';
    this.prevFocusEl = null;
    this.prevSelection = null;
  }
}

export default TextHighlighter;
