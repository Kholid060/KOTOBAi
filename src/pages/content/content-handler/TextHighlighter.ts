import { CursorOffset } from './caretPositionFromPoint';
import { NodeTypeChecker } from './content-handler-utils';
import { TextRange } from './extract-text-content';

interface HighlighterParam {
  matchLength: number;
  documentCtx: Document;
  textRange: TextRange[];
  cursorOffset: CursorOffset;
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

const STYLE_ID = 'extension-name';

class TextHighlighter {
  private selectedText: string | null;
  private prevSelection: PrevSelection;

  private highlightApiAvailable: boolean;
  private highlightStyleEl?: HTMLStyleElement;

  constructor() {
    this.selectedText = null;
    this.prevSelection = null;
    this.highlightApiAvailable = 'Highlight' in window && 'highlights' in CSS;
  }

  private injectHighlightStyle() {
    if (this.highlightStyleEl && this.highlightStyleEl.parentElement) return;

    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `::highlight(${STYLE_ID}) { background-color: #0ea5e9; color: #f0f9ff }`;

    document.head.appendChild(styleEl);

    this.highlightStyleEl = styleEl;
  }

  highlighText({
    textRange,
    matchLength,
    cursorOffset,
    highlightTextBox = true,
  }: {
    matchLength: number;
    textRange: TextRange[];
    highlightTextBox?: boolean;
    cursorOffset: CursorOffset;
  }) {
    CSS?.highlights?.delete(STYLE_ID);

    const documentCtx = cursorOffset.offsetNode.ownerDocument;
    if (!documentCtx || NodeTypeChecker.isImage(cursorOffset.offsetNode))
      return;

    this.storeCurrSelection(cursorOffset);

    const highlighterPayload = {
      textRange,
      matchLength,
      documentCtx,
      cursorOffset,
    };

    if (NodeTypeChecker.isInput(cursorOffset.offsetNode)) {
      if (!highlightTextBox) return;

      this.inputHighlighter(highlighterPayload);
    } else {
      this.nodeHighlighter(highlighterPayload);
    }
  }

  private inputHighlighter({
    textRange,
    matchLength,
    cursorOffset,
  }: HighlighterParam) {
    const [firstRange] = textRange;
    const el = cursorOffset.offsetNode as HTMLInputElement;

    const startOffset = firstRange.start;
    const endOffset = firstRange.start + matchLength;

    el.focus();
    el.setSelectionRange(startOffset, endOffset);

    this.selectedText = el.value.slice(startOffset, endOffset);
  }

  private nodeHighlighter({
    textRange,
    matchLength,
    documentCtx,
  }: HighlighterParam) {
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

    if (this.highlightApiAvailable) {
      const range = new StaticRange({
        endOffset: endOffset,
        endContainer: endNode,
        startOffset: startOffset,
        startContainer: startNode,
      });
      CSS.highlights!.set(STYLE_ID, new window.Highlight!(range));

      this.injectHighlightStyle();
      return;
    }

    const range = documentCtx.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    const selection = documentCtx.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);

    this.selectedText = selection.toString();
  }

  private storeCurrSelection(cursorOffset: CursorOffset) {
    if (this.prevSelection) return;

    const isInputFocus =
      document.activeElement && NodeTypeChecker.isInput(document.activeElement);
    if (isInputFocus) {
      const { selectionStart, selectionEnd, selectionDirection } =
        document.activeElement as HTMLInputElement;
      if (selectionStart === cursorOffset.offset) return;

      this.prevSelection = {
        type: 'input',
        end: selectionEnd!,
        start: selectionStart!,
        dir: selectionDirection!,
        el: document.activeElement as HTMLInputElement,
      };
      return;
    }

    const selection = window.getSelection();
    if (
      this.selectedText ||
      !selection ||
      selection.type !== 'Range' ||
      selection.toString() === this.selectedText
    )
      return;

    this.prevSelection = {
      type: 'node',
      end: selection.focusOffset,
      endNode: selection.focusNode!,
      start: selection.anchorOffset,
      startNode: selection.anchorNode!,
    };
  }

  private restorePrevSelection() {
    if (!this.prevSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString() === this.selectedText) {
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
      if (!selection) return;

      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  clearHighlight() {
    if (this.highlightApiAvailable) {
      CSS.highlights!.delete(STYLE_ID);
    }

    this.restorePrevSelection();

    this.selectedText = null;
    this.prevSelection = null;
  }
}

export default TextHighlighter;
