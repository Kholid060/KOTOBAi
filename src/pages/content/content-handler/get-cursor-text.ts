import {
  NodeTypeChecker,
  getNodeBoundingClientRect,
} from './content-handler-utils';
import { TextRange, extractTextNodeContent } from './extract-text-content';
import { CursorOffset, getCursorOffset } from './get-cursor-offset';

export interface CursorPoint {
  x: number;
  y: number;
}

export interface CursorOffsetText extends CursorOffset {
  text: string;
  offsetEnd: number;
  textRange: TextRange[];
}

export type GetCursorTextResult = {
  cursorOffset: CursorOffsetText;
  rect: DOMRect;
} | null;

let previousResult: GetCursorTextResult | null = null;

function getTextNodeRect({ offset, offsetNode }: CursorOffsetText): DOMRect {
  const range = new Range();
  range.setStart(offsetNode, offset);
  range.setEnd(offsetNode, Math.min(offsetNode.textContent.length, offset + 1));

  return range.getBoundingClientRect();
}

function returnResult(result: CursorOffsetText): GetCursorTextResult {
  if (!result) {
    previousResult = null;
    return null;
  }

  previousResult = {
    cursorOffset: result,
    rect: NodeTypeChecker.isText(result.offsetNode)
      ? getTextNodeRect(result)
      : getNodeBoundingClientRect(result.offsetNode),
  };

  return previousResult;
}

export function getCursorText({
  point,
  maxLength,
  element,
}: {
  element: Element;
  point: CursorPoint;
  maxLength?: number;
}): GetCursorTextResult {
  if (NodeTypeChecker.isImage(element)) {
    const text = element.getAttribute('alt') || element.getAttribute('title');
    return returnResult({
      text,
      offset: 0,
      textRange: [],
      offsetNode: element,
      offsetEnd: text.length - 1,
    });
  } else if (element.tagName === 'SELECT') {
    const text = (<HTMLSelectElement>element).value;
    return returnResult({
      text,
      offset: 0,
      textRange: [],
      offsetNode: element,
      offsetEnd: text.length - 1,
    });
  }

  const cursorOffset = getCursorOffset({ point, element });
  if (!cursorOffset) return returnResult(null);

  let isFake = false;
  let scanNode = cursorOffset.offsetNode;
  if (NodeTypeChecker.isInput(scanNode)) {
    isFake = true;
    scanNode = document.createTextNode((<HTMLInputElement>scanNode).value);
  }

  if (NodeTypeChecker.isText(scanNode)) {
    const textCursorOffset = { ...cursorOffset, offsetNode: scanNode };
    const textResult = extractTextNodeContent({
      cursorOffset: <CursorOffset<Text>>textCursorOffset,
      maxLength,
    });
    if (!textResult) return returnResult(null);

    const [textRange] = textResult.textRange;
    return returnResult({
      ...cursorOffset,
      offsetEnd: textRange.end,
      text: textResult.text || '',
      textRange: textResult.textRange,
      offsetNode: isFake ? cursorOffset.offsetNode : textRange.node,
    });
  }

  return returnResult(null);
}
