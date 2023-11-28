import {
  NodeTypeChecker,
  getNodeBoundingClientRect,
  isRectOverlap,
} from './content-handler-utils';
import { extractTextNodeContent } from './extract-text-content';
import { CursorOffset, getCursorOffset } from './get-cursor-offset';

export interface CursorPoint {
  x: number;
  y: number;
}

export interface CursorOffsetText extends CursorOffset {
  text: string;
  offsetEnd: number;
}

type CursorTextReturn = CursorOffsetText | null;

let previousResult: { rect: DOMRect; result: CursorOffsetText } | null = null;

function getTextNodeRect({ offset, offsetNode }: CursorTextReturn): DOMRect {
  const range = new Range();
  range.setStart(offsetNode, offset);
  range.setEnd(offsetNode, Math.min(offsetNode.textContent.length, offset + 1));

  return range.getBoundingClientRect();
}

function cacheResult(result: CursorTextReturn): CursorTextReturn {
  if (!result) {
    previousResult = null;
    return null;
  }

  previousResult = {
    result,
    rect: NodeTypeChecker.isText(result.offsetNode)
      ? getTextNodeRect(result)
      : getNodeBoundingClientRect(result.offsetNode),
  };

  return result;
}

export function getCursorText({
  point,
  maxLength,
  element,
}: {
  element: Element;
  point: CursorPoint;
  maxLength?: number;
}): CursorTextReturn {
  if (previousResult && isRectOverlap({ point, rect: previousResult.rect })) {
    console.log('CACHE');
    // return previousResult.result;
  }

  if (['IMG', 'PICTURE', 'VIDEO'].includes(element.tagName)) {
    const text = element.getAttribute('alt') || element.getAttribute('title');
    return cacheResult({
      text,
      offset: 0,
      offsetNode: element,
      offsetEnd: text.length - 1,
    });
  } else if (element.tagName === 'SELECT') {
    const text = (<HTMLSelectElement>element).value;
    return cacheResult({
      text,
      offset: 0,
      offsetNode: element,
      offsetEnd: text.length - 1,
    });
  }

  const cursorOffset = getCursorOffset({ point, element });
  if (!cursorOffset) return cacheResult(null);

  let scanNode = cursorOffset.offsetNode;
  if (NodeTypeChecker.isInput(scanNode)) {
    scanNode = document.createTextNode((<HTMLInputElement>scanNode).value);
  }

  if (NodeTypeChecker.isText(scanNode)) {
    const textCursorOffset = { ...cursorOffset, offsetNode: scanNode };
    const textResult = extractTextNodeContent({
      cursorOffset: <CursorOffset<Text>>textCursorOffset,
      maxLength,
    });
    if (!textResult) return cacheResult(null);

    return cacheResult({
      ...cursorOffset,
      text: textResult.text || '',
      offsetEnd: textResult.textRange[0].end,
    });
  }

  return cacheResult(null);
}
