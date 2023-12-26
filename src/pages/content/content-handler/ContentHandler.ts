import { debounce } from '@root/src/utils/helper';
import RuntimeMessage, {
  WordFrameSource,
} from '@root/src/utils/RuntimeMessage';
import EventEmitter from 'eventemitter3';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import TextHighlighter from './TextHighlighter';
import TextSearcher, {
  CursorPoint,
  GetTextByPointResult,
} from './TextSearcher';
import { NodeTypeChecker, isInMainFrame } from './content-handler-utils';
import { ClientRect } from '@root/src/interface/shared.interface';
import { CursorOffset } from './caretPositionFromPoint';
import { CONTENT_ROOT_EL_ID } from '../ui';

const MAX_CONTENT_LENGTH = 16;

interface SearchWordResult {
  rect?: ClientRect;
  point: CursorPoint;
  entry: SearchDictWordResult;
  cursorOffset?: CursorOffset;
  frameSource?: WordFrameSource;
}

interface Events {
  'clear-result': () => void;
  'disable-state-change': (disabled?: boolean) => void;
  'search-word-result': (result: SearchWordResult | null) => void;
}

const isInContentPopup = (el: EventTarget | Element) =>
  el instanceof Element ? el.id === CONTENT_ROOT_EL_ID : false;

export const contentEventEmitter = new EventEmitter<Events>();

interface ContentHandlerOptions {
  disabled?: boolean;
}

class ContentHandler {
  private _disabled = false;
  private isPointerDown = false;
  private isMainFrame = isInMainFrame();

  private textSearcher = new TextSearcher();
  private textHighlighter = new TextHighlighter();

  constructor({ disabled }: ContentHandlerOptions = { disabled: false }) {
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClearResult = this.onClearResult.bind(this);
    this.onPointerMove = debounce(this.onPointerMove.bind(this), 100);

    if (!disabled) this.attachListeners();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (value) this.detachListeners();
    else this.attachListeners();

    this._disabled = value;
  }

  private attachListeners() {
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);

    contentEventEmitter.addListener('clear-result', this.onClearResult);
  }

  private detachListeners() {
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);

    contentEventEmitter.removeListener('clear-result', this.onClearResult);
  }

  private onClearResult() {
    this.textHighlighter.clearHighlight();
  }

  private onPointerDown({ target }: PointerEvent) {
    if (this._disabled) return;

    this.isPointerDown = true;

    if (target && !isInContentPopup(target))
      this.textHighlighter.clearHighlight();
  }

  private onPointerUp() {
    if (this._disabled) return;

    this.isPointerDown = false;
  }

  private onPointerMove(event: PointerEvent) {
    if (
      this.isPointerDown ||
      this._disabled ||
      (event.target && isInContentPopup(event.target))
    )
      return;

    const cursorPoint = { x: event.clientX, y: event.clientY };
    const result = this.textSearcher.getTextByPoint({
      point: cursorPoint,
      maxLength: MAX_CONTENT_LENGTH,
      element: <Element>event.target,
    });
    if (!result) {
      contentEventEmitter.emit('search-word-result', null);
      this.textHighlighter.clearHighlight();
      return;
    }

    this.searchText({ ...result, cursorPoint });
  }

  private async searchText({
    text,
    rect,
    textRange,
    cursorOffset,
    cursorPoint,
  }: GetTextByPointResult & { cursorPoint: CursorPoint }) {
    try {
      let frameSource: WordFrameSource | undefined;
      if (!this.isMainFrame) {
        frameSource = {
          point: cursorPoint,
          frameURL: window.location.href,
          rect: window.frameElement?.getBoundingClientRect(),
        };

        if (rect) {
          frameSource.point.x = rect.right;
          frameSource.point.y = rect.bottom;
        }
      }

      const messageKey = this.isMainFrame
        ? 'background:search-word'
        : 'background:search-word-iframe';

      const searchResult = await RuntimeMessage.sendMessage(messageKey, {
        frameSource,
        input: text,
        maxResult: 7,
        maxQueryLimit: 2,
        type: NodeTypeChecker.isImage(cursorOffset.offsetNode)
          ? 'whole'
          : 'search-backward',
      });

      if (searchResult) {
        this.textHighlighter.highlighText({
          textRange: textRange,
          cursorOffset: cursorOffset,
          matchLength: searchResult.maxLength,
        });
      } else {
        this.textHighlighter.clearHighlight();
      }

      if (!this.isMainFrame) return;

      contentEventEmitter.emit('search-word-result', {
        rect,
        point: cursorPoint,
        entry: searchResult,
        cursorOffset: cursorOffset,
      });
    } catch (error) {
      console.error(error);
      contentEventEmitter.emit('search-word-result', null);
    }
  }

  destroy() {
    this.detachListeners();
    contentEventEmitter.removeAllListeners();
  }
}

export default ContentHandler;
