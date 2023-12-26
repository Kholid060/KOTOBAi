/*
 * Copyright (C) 2020-2022  10ten-ja-reader Authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * https://github.com/birchill/10ten-ja-reader
 */

import { NON_JP_CHARS_REGEX } from '@src/shared/constant/char.const';
import { CursorOffset } from './caretPositionFromPoint';

const INLINE_CSS_DISPLAY = ['inline', 'inline-block'];
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

export interface TextRange {
  node: Node;
  end: number;
  start: number;
}

export function extractTextNodeContent({
  cursorOffset,
  maxLength = 10,
}: {
  maxLength?: number;
  cursorOffset: CursorOffset<Text>;
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
    treeWalkerFilter!,
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

  const result: { text: string; textRange: TextRange[] } = {
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
      isInlineElement(node.parentElement!))
  );

  if (!result.textRange.length) return null;

  return result;
}
