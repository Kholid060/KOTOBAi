import { CursorPoint } from './TextSearcher';

export const NodeTypeChecker = {
  isText: (node: Node) => node.nodeType === Node.TEXT_NODE,
  isElement: (node: Node) => node.nodeType === Node.ELEMENT_NODE,
  isInput: (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;

    return ['TEXTAREA', 'INPUT'].includes((<Element>node).tagName);
  },
  isShadowDOM: (node: Node) => {
    return node.nodeType === Node.ELEMENT_NODE && (<Element>node).shadowRoot;
  },
  isImage: (node: Node) =>
    node.nodeType === Node.ELEMENT_NODE &&
    ['IMG', 'PICTURE', 'VIDEO'].includes((<Element>node).tagName),
};

export function mirrorElement(target: Element, text?: string) {
  const COPY_CSS_PROPS = [
    'padding',
    'font',
    'boxSizing',
    'border',
    'letterSpacing',
    'overflow',
    'wordSpacing',
  ];

  const targetRect = target.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(target);

  const mirrorEl = document.createElement('div');
  mirrorEl.textContent = text || '';

  COPY_CSS_PROPS.forEach((key) => {
    mirrorEl.style.setProperty(key, targetStyle[key]);
  });

  mirrorEl.scrollTop = target.scrollTop;
  mirrorEl.scrollLeft = target.scrollLeft;

  mirrorEl.style.setProperty('z-index', '9999999');
  mirrorEl.style.setProperty('position', 'absolute');
  mirrorEl.style.setProperty('white-space', 'pre-wrap');
  mirrorEl.style.setProperty('top', targetRect.top + 'px');
  mirrorEl.style.setProperty('left', targetRect.left + 'px');
  mirrorEl.style.setProperty('width', targetRect.width + 'px');
  mirrorEl.style.setProperty('height', targetRect.height + 'px');

  document.documentElement.appendChild(mirrorEl);

  return mirrorEl;
}

export function getNodeBoundingClientRect(
  el: Node | Element,
  offset?: { start: number; end: number },
): DOMRect {
  if ('getBoundingClientRect' in el) {
    return el.getBoundingClientRect();
  }

  const range = document.createRange();
  if (offset) {
    range.setStart(el, offset.start);
    range.setStart(el, offset.end);
  } else {
    range.selectNode(el);
  }

  return range.getBoundingClientRect();
}

export function isRectOverlap({
  point: { x, y },
  rect: { left, top, height, width },
}: {
  rect: DOMRect;
  point: CursorPoint;
}) {
  return left <= x && left + width >= x && top <= y && top + height >= y;
}

export function isInMainFrame() {
  return window.self === window.top;
}
