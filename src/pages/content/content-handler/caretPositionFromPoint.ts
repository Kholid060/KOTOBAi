/* eslint-disable @typescript-eslint/no-unused-vars */
import { CursorPoint } from './TextSearcher';
import {
  NodeTypeChecker,
  mirrorElement,
  isRectOverlap,
  getNodeBoundingClientRect,
} from './content-handler-utils';

export interface CursorOffset<T extends Node = Node> {
  offsetNode: T;
  offset: number;
}

const SUPPORTED_INPUT_TYPES = [
  'url',
  'text',
  'email',
  'search',
  'submit',
  'button',
  'textarea',
];

function getCursorOffsetFromTextField({
  point,
  inputEl,
}: {
  point: CursorPoint;
  inputEl: HTMLInputElement | HTMLTextAreaElement;
}) {
  if (!SUPPORTED_INPUT_TYPES.includes(inputEl.type)) return null;

  const mirrorEl = mirrorElement(inputEl, inputEl.value);
  const result = caretPositionFromPoint({ point, element: mirrorEl });
  if (result) result.offsetNode = inputEl;

  mirrorEl.remove();

  return result;
}

function isElVisible(element: Element) {
  if (element.checkVisibility) {
    return element.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    });
  }

  if (
    (<HTMLElement>element).offsetParent &&
    (<HTMLElement>element).offsetParent === null
  )
    return false;

  const { opacity, visibility } = getComputedStyle(element);
  return opacity !== '0' && visibility !== 'hidden';
}

function findShadowRoot({
  point,
  element,
}: {
  point: CursorPoint;
  element: Element;
}): ShadowRoot | null {
  if (element.shadowRoot) return element.shadowRoot;

  const MAX_CHILD_CHECK = 10;
  let checkedChildCount = 0;

  for (const child of element.children) {
    checkedChildCount += 1;
    if (checkedChildCount > MAX_CHILD_CHECK) return null;

    if (!child.shadowRoot) continue;

    const rect = child.getBoundingClientRect();
    if (!isRectOverlap({ point, rect })) continue;

    return child.shadowRoot;
  }

  return null;
}
function findShadowNodeByPoint({
  shadowRoot,
  point,
}: {
  shadowRoot: ShadowRoot;
  point: CursorPoint;
}): Node | Text | Element | null {
  const textNodes = [...shadowRoot.childNodes].filter(NodeTypeChecker.isText);
  for (const textNode of textNodes) {
    const textNodeRange = document.createRange();
    textNodeRange.selectNode(textNode);

    const rects = textNodeRange.getClientRects();
    const isOverlap = [...rects].some((rect) => isRectOverlap({ rect, point }));
    if (isOverlap) return textNode;
  }

  const elements = shadowRoot.elementsFromPoint(point.x, point.y);
  const visibleEl = elements.find((el) => isElVisible(el));
  if (!visibleEl) return null;

  const nestedShadowRoot = findShadowRoot({ point, element: visibleEl });
  if (nestedShadowRoot && nestedShadowRoot !== shadowRoot)
    return findShadowNodeByPoint({ shadowRoot: nestedShadowRoot, point });

  return visibleEl;
}
function shadowDOMChecker({
  position,
  point,
}: {
  point: CursorPoint;
  position: Range;
}): Range {
  const container = position.startContainer as HTMLElement;
  if (!NodeTypeChecker.isElement(container)) return position;

  const shadowRoot = findShadowRoot({ element: container, point });
  if (!shadowRoot) return position;

  const shadowNode = findShadowNodeByPoint({ shadowRoot, point });
  if (!shadowNode || shadowNode === container) return position;

  if (NodeTypeChecker.isInput(shadowNode)) {
    const range = new Range();
    range.setStart(shadowNode, 0);
    range.setEnd(shadowNode, 0);

    return range;
  }

  console.warn('HANDLE SHADOW ROOT', shadowNode);

  return position;
}
function caretRangeFromPointExtended({
  point,
  element,
}: {
  point: CursorPoint;
  element: Element;
}): CursorOffset | null {
  if (element && NodeTypeChecker.isInput(element)) {
    return getCursorOffsetFromTextField({
      inputEl: <HTMLInputElement>element,
      point,
    });
  }

  const position = document.caretRangeFromPoint(point.x, point.y);
  if (!position) return null;

  const rect = getNodeBoundingClientRect(position.startContainer);
  if (!isRectOverlap({ point, rect })) return null;

  if (NodeTypeChecker.isInput(position.startContainer)) {
    return getCursorOffsetFromTextField({
      point,
      inputEl: <HTMLInputElement>position.startContainer,
    });
  }

  return {
    offset: position.startOffset,
    offsetNode: position.startContainer,
  };
}

export function caretPositionFromPoint({
  point,
  element,
}: {
  element: Element;
  point: CursorPoint;
}): CursorOffset | null {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(point.x, point.y);
    if (!position?.offsetNode) return null;

    return { offset: position.offset, offsetNode: position.offsetNode };
  }

  return caretRangeFromPointExtended({ element, point });
}
