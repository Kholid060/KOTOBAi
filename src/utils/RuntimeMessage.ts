import Browser, { Runtime } from 'webextension-polyfill';
import { isObject } from './helper';
import { SearchDictWordResult } from '../pages/background/messageHandler/dictWordSearcher';
import { SetOptional } from 'type-fest';
import { DictSearchKanjiOptions } from '../shared/db/dict.db';
import {
  DictKanjiEntry,
  DictKanjiVGEntry,
  DictSearchOptions,
} from '../interface/dict.interface';
import { DictionaryNameEntryResult } from '../pages/background/messageHandler/dictNameSearcher';
import { DICTIONARY_NAME } from '../shared/constant/constant';
import { BookmarkItem } from '../interface/bookmark.interface';
import {
  BookmarkAddPayload,
  BookmarkIdPayload,
} from '../shared/db/bookmark.db';

export interface MessageSearchWordOpts
  extends SetOptional<Omit<DictSearchOptions, 'matchWhole'>, 'maxResult'> {
  input: string;
  frameId?: number;
  maxQueryLimit?: number;
  type?: 'search-backward' | 'search-forward' | 'whole';
}

export type MessageSearchNameOpts = Omit<MessageSearchWordOpts, 'frameSource'>;

export type DisableExtPayload =
  | { type: 'all'; disable: boolean }
  | { type: 'host'; host: string; disable: boolean };

export interface BookmarkDictionaryPayload {
  id: number;
  value: boolean;
  type:
    | DICTIONARY_NAME.KANJIDIC
    | DICTIONARY_NAME.ENAMDICT
    | DICTIONARY_NAME.JMDICT;
}

export interface RuntimeMsgEvents {
  'background:bookmark-get': <T extends boolean>(
    id: BookmarkIdPayload,
    boolean: T,
  ) => T extends true ? boolean : BookmarkItem[];
  'background:dashboard-open': (path?: string) => void;
  'background:get-frame-id': () => number | null;
  'background:bookmark-toggle': (
    payload: BookmarkAddPayload & { id?: string },
    value: boolean,
  ) => void;
  'background:set-disabled-badge': () => void;
  'background:search-name': (
    detail: MessageSearchNameOpts,
  ) => DictionaryNameEntryResult[];
  'background:search-word': (
    detail: MessageSearchWordOpts,
  ) => SearchDictWordResult | null;
  'background:search-kanji': (
    detail: DictSearchKanjiOptions,
  ) => DictKanjiEntry[];
  'background:search-kanjivg': (detail: {
    input: number | number[];
  }) => DictKanjiVGEntry[];
  'background:disable-ext': (payload: DisableExtPayload) => void;
  'content:iframe-highlight-text': (detail: {
    text: string;
    matchLength: number;
  }) => void;
  'content:open-search-command': () => void;
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
    this.runtimeMessageListener = this.runtimeMessageListener.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private runtimeMessageListener(message: any, sender: Runtime.MessageSender) {
    if (!isObject(message) || !Object.hasOwn(message, 'name')) return;
    const callback = this.eventListeners.get(message.name);
    if (!callback) return;

    return callback(...(message.args ?? []), sender) as Promise<unknown>;
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
    // @ts-expect-error aaa
    this.eventListeners.set(name, callback);

    const hasListener = Browser.runtime.onMessage.hasListener(
      this.runtimeMessageListener,
    );
    if (!hasListener) {
      Browser.runtime.onMessage.addListener(this.runtimeMessageListener);
    }

    return this.onMessage;
  }

  removeListener(name: keyof RuntimeMsgEvents) {
    this.eventListeners.delete(name);

    if (this.eventListeners.size === 0) {
      Browser.runtime.onMessage.removeListener(this.runtimeMessageListener);
    }
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
