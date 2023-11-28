import { CursorOffset } from './get-cursor-offset';

const INLINE_CSS_DISPLAY = ['inline', 'inline-block'];
const NON_JP_CHARS_REGEX =
  /[^\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

function isRubyAnnotationElement(element: Element | null) {
  return element && ['RP', 'RT'].includes(element.tagName);
}

function isInlineElement(el: Element) {
  const isInline = (element: Element) =>
    INLINE_CSS_DISPLAY.includes(getComputedStyle(element).display);

  if (isInline(el)) return true;
  else if (el.parentElement && isInline(el.parentElement)) return true;

  return false;
}

export function extractTextNodeContent({
  cursorOffset,
  maxLength = 10,
}: {
  cursorOffset: CursorOffset<Text>;
  maxLength?: number;
}) {
  let inlineAncestor = cursorOffset.offsetNode.parentElement;
  while (
    inlineAncestor &&
    isInlineElement(inlineAncestor) &&
    !isRubyAnnotationElement(inlineAncestor)
  ) {
    inlineAncestor = inlineAncestor!.parentElement;
  }

  let treeWalkerFilter: NodeFilter;
  if (!isRubyAnnotationElement(inlineAncestor)) {
    treeWalkerFilter = {
      acceptNode: (node) =>
        isRubyAnnotationElement(node.parentElement)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    };
  }

  const treeWalker = document.createTreeWalker(
    inlineAncestor || cursorOffset.offsetNode,
    NodeFilter.SHOW_TEXT,
    treeWalkerFilter,
  );
  while (
    treeWalker.currentNode !== cursorOffset.offsetNode &&
    treeWalker.nextNode()
  );

  if (treeWalker.currentNode !== cursorOffset.offsetNode) {
    console.error('Could not find node in tree', cursorOffset.offsetNode);
    return null;
  }

  let offset = cursorOffset.offset;
  let node = cursorOffset.offsetNode;
  do {
    const nodeText = node.data.substring(offset);
    const textStart = nodeText.search(/\S/);
    if (textStart !== -1) {
      offset += textStart;
      break;
    }

    node = <Text>treeWalker.nextNode();
    offset = 0;
  } while (node);

  if (!node) return null;

  type NodeRange = { node: Node; start: number; end: number };
  const result: { text: string; textRange: NodeRange[] } = {
    text: '',
    textRange: [],
  };

  do {
    const nodeText = node.data.substring(offset);
    let textEnd = nodeText.search(NON_JP_CHARS_REGEX);

    if (typeof maxLength === 'number' && maxLength >= 0) {
      const maxEnd = maxLength - result.text.length;
      if (textEnd === -1) {
        textEnd = node.data.length - offset >= maxEnd ? maxEnd : -1;
      } else {
        textEnd = Math.min(textEnd, maxEnd);
      }
    }

    if (textEnd === 0) break;
    if (textEnd !== -1) {
      result.text += nodeText.substring(0, textEnd);
      result.textRange.push({
        node,
        start: offset,
        end: offset + textEnd,
      });
      break;
    }

    result.text += nodeText;
    result.textRange.push({
      node,
      start: offset,
      end: node.data.length,
    });
    node = <Text>treeWalker.nextNode();
    offset = 0;
  } while (
    node &&
    inlineAncestor &&
    (node.parentElement === inlineAncestor ||
      isInlineElement(node.parentElement))
  );

  if (!result.textRange.length) return null;

  return result;
}
