import { isJapanese } from 'wanakana';
import {
  NodeTypeChecker,
  getNodeBoundingClientRect,
} from './content-handler-utils';
import { NON_JP_CHARS_REGEX } from '@root/src/shared/constant/char.const';
import { TextRange, extractTextNodeContent } from './extract-text-content';
import { getCursorPosByPoint } from './caretPositionFromPoint';
import { SetOptional } from 'type-fest';

export interface CursorPoint {
  x: number;
  y: number;
}

export interface CursorOffset<T extends Node = Node> {
  offsetNode: T;
  offset: number;
}

export type GetTextByPointResult = {
  text: string;
  rect: DOMRect;
  textRange: TextRange[];
  cursorOffset: CursorOffset;
};

function findJPText(str: string, maxLength: number) {
  let text = str.slice(0, maxLength).trim();
  if (!text || !isJapanese(text[0] || '')) return null;

  const textEnd = str.search(NON_JP_CHARS_REGEX);
  if (textEnd !== -1) text = text.slice(0, textEnd);

  return text;
}

class TextSearcher {
  private previousResult: GetTextByPointResult | null = null;

  // to-do: move pointer events to here
  constructor() {}

  getTextByPoint({
    point,
    element,
    maxLength,
  }: {
    element: Element;
    maxLength: number;
    point: CursorPoint;
  }): GetTextByPointResult | null {
    if (NodeTypeChecker.isImage(element)) {
      const text = findJPText(
        (element.getAttribute('alt') || element.getAttribute('title')) ?? '',
        maxLength,
      );
      if (!text) return this.cacheTextResult(null);

      return this.cacheTextResult({
        text,
        textRange: [],
        cursorOffset: {
          offset: 0,
          offsetNode: element,
        },
      });
    } else if (element.tagName === 'SELECT') {
      const text = findJPText((<HTMLSelectElement>element).value, maxLength);
      if (!text) return this.cacheTextResult(null);

      return this.cacheTextResult({
        text,
        textRange: [],
        cursorOffset: {
          offset: 0,
          offsetNode: element,
        },
      });
    }

    const cursorOffset = getCursorPosByPoint({ point, element });
    if (!cursorOffset) return this.cacheTextResult(null);

    let isFake = false;
    let scanNode = cursorOffset.offsetNode;
    if (NodeTypeChecker.isInput(scanNode)) {
      isFake = true;
      scanNode = document.createTextNode((<HTMLInputElement>scanNode).value);
    }

    if (NodeTypeChecker.isText(scanNode)) {
      const textCursorOffset = { ...cursorOffset, offsetNode: scanNode };
      const textResult = extractTextNodeContent({
        maxLength,
        cursorOffset: <CursorOffset<Text>>textCursorOffset,
      });
      if (!textResult) return this.cacheTextResult(null);

      const [textRange] = textResult.textRange;
      return this.cacheTextResult({
        text: textResult.text || '',
        textRange: textResult.textRange,
        cursorOffset: {
          ...cursorOffset,
          offsetNode: isFake ? cursorOffset.offsetNode : textRange.node,
        },
      });
    }

    return this.cacheTextResult(null);
  }

  private cacheTextResult(
    result: SetOptional<GetTextByPointResult, 'rect'> | null,
  ): GetTextByPointResult | null {
    if (!result) {
      this.previousResult = null;
      return null;
    }

    const { cursorOffset } = result;

    let offset: { start: number; end: number };
    if (NodeTypeChecker.isText(cursorOffset.offsetNode)) {
      offset = {
        start: cursorOffset.offset,
        end: Math.min(
          cursorOffset.offset + 1,
          cursorOffset.offsetNode.textContent!.length,
        ),
      };
    }

    const rect = getNodeBoundingClientRect(cursorOffset.offsetNode, offset!);
    const finalResult = { ...result, rect };

    if (
      rect.height > 100 &&
      rect.width > 100 &&
      !NodeTypeChecker.isInput(cursorOffset.offsetNode)
    ) {
      this.previousResult = finalResult;
    }

    return finalResult;
  }
}

export default TextSearcher;
