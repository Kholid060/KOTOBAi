import { debounce } from '@root/src/utils/helper';
import {
  CursorPoint,
  GetCursorTextResult,
  getCursorText,
} from './get-cursor-text';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import EventEmitter from 'eventemitter3';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import TextHighlighter from './TextHighlighter';

const MAX_CONTENT_LENGTH = 16;

interface SearchWordResult extends GetCursorTextResult {
  point: CursorPoint;
  entry: SearchDictWordResult;
}

interface Events {
  'search-word-result': (result: SearchWordResult | null) => void;
}

class ContentHandler extends EventEmitter<Events> {
  private isPointerDown = false;
  private textHighlighter = new TextHighlighter();

  constructor() {
    super();

    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = debounce(this.onPointerMove.bind(this), 100);

    this.attachListeners();
  }

  private attachListeners() {
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  private detachListeners() {
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
  }

  private onPointerDown() {
    this.isPointerDown = true;
  }

  private onPointerUp() {
    this.isPointerDown = false;
  }

  private onPointerMove(event: PointerEvent) {
    if (this.isPointerDown) return;

    const cursorPoint = { x: event.clientX, y: event.clientY };
    const result = getCursorText({
      point: cursorPoint,
      maxLength: MAX_CONTENT_LENGTH,
      element: <Element>event.target,
    });
    if (!result) {
      this.emit('search-word-result', null);
      this.textHighlighter.clearHighlight();
      return;
    }

    RuntimeMessage.sendMessage('background:search-word', {
      input: result.cursorOffset.text,
    })
      .then((searchResult) => {
        if (searchResult) {
          this.textHighlighter.highlighText({
            cursorOffset: result.cursorOffset,
            matchLength: searchResult.maxLength,
          });
        }

        console.log('RESU:T', searchResult);

        this.emit('search-word-result', {
          ...result,
          point: cursorPoint,
          entry: searchResult,
        });
      })
      .catch((error) => {
        console.error(error);
        this.emit('search-word-result', null);
      });
  }

  destroy() {
    this.detachListeners();
    this.removeAllListeners();
  }
}

export default ContentHandler;
