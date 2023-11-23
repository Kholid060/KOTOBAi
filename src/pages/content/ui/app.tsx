import { debounce } from '@root/src/utils/helper';
import { useEventListener } from 'usehooks-ts';

/**
 * https://github.com/wtetsu/mouse-dictionary
 * https://github.com/birchill/10ten-ja-reader
 */

const MAX_TEXT_LEN = 12;
const JP_CHARS_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

function caretPositionFromPoint(x: number, y: number) {
  let range: Range | null = null;

  if (document.caretPositionFromPoint) {
    range = document.caretPositionFromPoint(x, y);
  } else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  }

  return range;
}

const jpWordSegmenter = new Intl.Segmenter('ja', { granularity: 'word' });

export default function App() {
  useEventListener('mousemove', debounce(({ target, clientX, clientY }) => {
    const range = caretPositionFromPoint(clientX, clientY);
    if (!range) return;
    

    const startNode = range.startContainer;
    const text = startNode.textContent.slice(range.startOffset, range.startOffset + MAX_TEXT_LEN);
    
    if (!JP_CHARS_REGEX.test(text)) return;
    
    const words = [...jpWordSegmenter.segment(text)];
    console.log(text, words, range, words[0]?.segment);
  }, 500));

  return <div className="bg-blue-900">content view</div>;
}
