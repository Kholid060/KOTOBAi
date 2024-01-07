import { debounce, isObject } from '@root/src/utils/helper';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import EventEmitter from 'eventemitter3';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import TextHighlighter from './TextHighlighter';
import TextSearcher, { CursorPoint } from './TextSearcher';
import { getMessageIframeSource, isInMainFrame } from './content-handler-utils';
import { ClientRect } from '@root/src/interface/shared.interface';
import { CursorOffset } from './caretPositionFromPoint';
import { CONTENT_ROOT_EL_ID } from '../ui';
import extSettingsStorage, {
  ExtensionSettings,
  ExtensionSettingsScanning,
} from '@root/src/shared/storages/extSettingsStorage';
import Browser from 'webextension-polyfill';
import { TextRange } from './extract-text-content';

const MAX_CONTENT_LENGTH = 16;

export interface ContentSearchWordResult {
  rect?: ClientRect;
  point: CursorPoint;
  entry: SearchDictWordResult;
  cursorOffset?: CursorOffset;
}

interface MessageEventPayload {
  frameId: number;
  type: 'kotobai:iframe';
  result: null | { x: number; y: number; text: string };
}

interface LastScanResult {
  text: string;
  textRange: TextRange[];
  cursorOffset: CursorOffset;
}

interface Events {
  'clear-result': () => void;
  'disable-state-change': (disabled?: boolean) => void;
  'search-word-result': (result: ContentSearchWordResult | null) => void;
}

const isInContentPopup = (el: EventTarget | Element) =>
  el instanceof Element ? el.id === CONTENT_ROOT_EL_ID : false;

export const contentEventEmitter = new EventEmitter<Events>();

interface ContentHandlerOptions {
  disabled?: boolean;
}

function isMatchScannerModifier(
  event: PointerEvent,
  mod: ExtensionSettingsScanning['modifier'],
) {
  switch (mod) {
    case 'none':
      return true;
    case 'alt':
      return event.altKey;
    case 'ctrl':
      return event.ctrlKey || event.metaKey;
    case 'shift':
      return event.shiftKey;
    default:
      return false;
  }
}
class ContentHandler {
  private frameId = -1;
  private _disabled = false;
  private isPointerDown = false;
  private isMainFrame = isInMainFrame();
  private lastScanResult: null | LastScanResult = null;
  private extSettings: ExtensionSettings = extSettingsStorage.$defaultValue;

  private textSearcher = new TextSearcher();
  private textHighlighter = new TextHighlighter();

  constructor({ disabled }: ContentHandlerOptions = { disabled: false }) {
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onExtStorage = this.onExtStorage.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClearResult = this.onClearResult.bind(this);
    this.onWindowMessage = this.onWindowMessage.bind(this);
    this.onPointerMove = debounce(this.onPointerMove.bind(this), 100);

    this.disabled = disabled ?? false;

    this._init();
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (value) this.detachListeners();
    else this.attachListeners();

    this._disabled = value;
  }

  private _init() {
    extSettingsStorage.get().then((settings) => {
      this.extSettings = settings;
    });

    if (!this.isMainFrame) {
      RuntimeMessage.sendMessage('background:get-frame-id').then((frameId) => {
        if (typeof frameId === 'number') this.frameId = frameId;
      });
    }
  }

  private messageTopWindow(result: MessageEventPayload['result']) {
    window.top?.postMessage(
      {
        result,
        frameId: this.frameId,
        type: 'kotobai:iframe',
      } as MessageEventPayload,
      '*',
    );
  }

  private attachListeners() {
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('message', this.onWindowMessage);
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);

    Browser.storage.local.onChanged.addListener(this.onExtStorage);

    contentEventEmitter.addListener('clear-result', this.onClearResult);
  }

  private detachListeners() {
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('message', this.onWindowMessage);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);

    Browser.storage.local.onChanged.addListener(this.onExtStorage);

    contentEventEmitter.removeListener('clear-result', this.onClearResult);
  }

  highlightLastScan(text: string, matchLength: number) {
    if (!this.lastScanResult) return;
    if (this.lastScanResult.text !== text) {
      this.lastScanResult = null;
      return;
    }

    this.textHighlighter.highlighText({
      ...this.lastScanResult,
      matchLength,
      highlightTextBox: this.extSettings.scanning.highlightTextBox,
    });
    this.lastScanResult = null;
  }

  private onWindowMessage(event: MessageEvent<MessageEventPayload>) {
    const { data } = event;
    if (!isObject(data) || data.type !== 'kotobai:iframe') return;

    if (data.result) {
      const iframe = getMessageIframeSource(event);
      if (!iframe) return;

      const iframeRect = iframe.getBoundingClientRect();
      data.result.x += iframeRect.x;
      data.result.y += iframeRect.y;
    }

    if (!this.isMainFrame) {
      this.messageTopWindow(data.result);
      return;
    }

    if (!data.result) {
      contentEventEmitter.emit('search-word-result', null);
      return;
    }

    const { text, x, y } = data.result;
    this.searchText({
      text: text,
      frameId: this.extSettings.scanning.highlightText
        ? data.frameId
        : undefined,
    })
      .then((searchResult) => {
        contentEventEmitter.emit(
          'search-word-result',
          searchResult
            ? {
                point: { x, y },
                entry: searchResult,
              }
            : null,
        );
      })
      .catch(() => {
        contentEventEmitter.emit('search-word-result', null);
      });
  }

  private onExtStorage(
    changes: Browser.Storage.StorageAreaOnChangedChangesType,
  ) {
    const updatedSettings = changes[extSettingsStorage.$key];
    if (updatedSettings) {
      this.extSettings = updatedSettings.newValue as ExtensionSettings;
    }
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

    if (!isMatchScannerModifier(event, this.extSettings.scanning.modifier)) {
      contentEventEmitter.emit('search-word-result', null);
      this.textHighlighter.clearHighlight();
      this.messageTopWindow(null);
      this.lastScanResult = null;
      return;
    }

    const cursorPoint = { x: event.clientX, y: event.clientY };
    const result = this.textSearcher.getTextByPoint({
      point: cursorPoint,
      maxLength: MAX_CONTENT_LENGTH,
      element: <Element>event.target,
    });
    if (!result) {
      contentEventEmitter.emit('search-word-result', null);
      this.textHighlighter.clearHighlight();
      this.messageTopWindow(null);
      this.lastScanResult = null;
      return;
    }

    const { highlightText } = this.extSettings.scanning;
    const { rect, text, cursorOffset, textRange } = result;

    if (!this.isMainFrame) {
      if (highlightText) {
        this.lastScanResult = { cursorOffset, text, textRange };
      }
      this.messageTopWindow({
        text,
        x: rect.x,
        y: rect.y,
      });

      return;
    }

    // MAIN FRAME ONLY
    this.searchText({ text: result.text })
      .then((searchResult) => {
        contentEventEmitter.emit(
          'search-word-result',
          searchResult
            ? {
                rect,
                point: cursorPoint,
                entry: searchResult,
                cursorOffset: cursorOffset,
              }
            : null,
        );

        if (searchResult && highlightText) {
          this.textHighlighter.highlighText({
            textRange: textRange,
            cursorOffset: cursorOffset,
            matchLength: searchResult.maxLength,
            highlightTextBox: this.extSettings.scanning.highlightTextBox,
          });
        } else {
          this.textHighlighter.clearHighlight();
        }
      })
      .catch(() => {
        this.textHighlighter.clearHighlight();
        contentEventEmitter.emit('search-word-result', null);
      });
  }

  private async searchText({
    text,
    frameId,
  }: {
    text: string;
    frameId?: number;
  }) {
    const searchResult = await RuntimeMessage.sendMessage(
      'background:search-word',
      {
        frameId,
        input: text,
        maxResult: 7,
        maxQueryLimit: 2,
      },
    );

    return searchResult;
  }

  destroy() {
    this.detachListeners();
    contentEventEmitter.removeAllListeners();
  }
}

export default ContentHandler;
