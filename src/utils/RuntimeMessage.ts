import Browser from 'webextension-polyfill';
import { isObject } from './helper';
import { SearchDictWordResult } from '../pages/background/messageHandler/dictWordSearcher';
import { CursorPoint } from '../pages/content/content-handler/TextSearcher';
import { SetOptional, SetRequired } from 'type-fest';
import { ClientRect } from '../interface/shared.interface';
import { DictSearchKanjiOptions } from './Dictionary';
import { DictKanjiEntry, DictSearchOptions } from '../interface/dict.interface';
import { DictionaryNameEntryResult } from '../pages/background/messageHandler/dictNameSearcher';

export interface WordFrameSource {
  frameURL: string;
  rect?: ClientRect;
  point: CursorPoint;
}
export interface MessageSearchWordOpts
  extends SetOptional<Omit<DictSearchOptions, 'matchWhole'>, 'maxResult'> {
  input: string;
  maxQueryLimit?: number;
  frameSource?: WordFrameSource;
  type?: 'search-backward' | 'search-forward' | 'whole';
}

export type MessageSearchNameOpts = Omit<MessageSearchWordOpts, 'frameSource'>;

export type DisableExtPayload =
  | { type: 'all'; disable: boolean }
  | { type: 'host'; host: string; disable: boolean };

export interface RuntimeMsgEvents {
  'background:set-disabled-badge': () => void;
  'background:search-name': (
    detail: MessageSearchNameOpts,
  ) => DictionaryNameEntryResult[];
  'background:search-word': (
    detail: MessageSearchWordOpts,
  ) => SearchDictWordResult;
  'background:search-kanji': (
    detail: DictSearchKanjiOptions,
  ) => DictKanjiEntry[];
  'background:search-word-iframe': (
    detail: SetRequired<MessageSearchWordOpts, 'frameSource'>,
  ) => SearchDictWordResult;
  'background:disable-ext': (payload: DisableExtPayload) => void;
  'content:iframe-word-result': (
    result: SearchDictWordResult & { frameSource: WordFrameSource },
  ) => void;
  'content:disable-ext-state': (disabled: boolean) => void;
}

type EventListener = Map<string, (...args: unknown[]) => unknown>;

export interface RuntimeMessagePayload {
  args: unknown[];
  name: keyof RuntimeMsgEvents;
}

class RuntimeMessage {
  private eventListeners: EventListener;

  constructor() {
    this.eventListeners = new Map();

    this.init();
  }

  private init() {
    Browser.runtime.onMessage.addListener((message, sender) => {
      if (!isObject(message) || !Object.hasOwn(message, 'name')) return;

      const callback = this.eventListeners.get(message.name);
      if (!callback) return;

      return callback(...(message.args ?? []), sender) as Promise<unknown>;
    });
  }

  onMessage<T extends keyof RuntimeMsgEvents>(
    name: T,
    callback: (
      ...args: [
        ...Parameters<RuntimeMsgEvents[T]>,
        Browser.Runtime.MessageSender,
      ]
    ) => ReturnType<RuntimeMsgEvents[T]> extends void
      ? void
      : Promise<ReturnType<RuntimeMsgEvents[T]>>,
  ) {
    this.eventListeners.set(name, callback);

    return this.onMessage;
  }

  sendMessage<T extends keyof RuntimeMsgEvents>(
    name: T,
    ...args: Parameters<RuntimeMsgEvents[T]>
  ) {
    return Browser.runtime.sendMessage({ name, args }) as Promise<
      ReturnType<RuntimeMsgEvents[T]>
    >;
  }

  sendMessageToTab<T extends keyof RuntimeMsgEvents>(
    { name, tabId, frameId }: { name: T; tabId: number; frameId?: number },
    ...args: Parameters<RuntimeMsgEvents[T]>
  ) {
    return Browser.tabs.sendMessage(
      tabId,
      { name, args },
      { frameId },
    ) as Promise<ReturnType<RuntimeMsgEvents[T]>>;
  }
}

export default new RuntimeMessage();
