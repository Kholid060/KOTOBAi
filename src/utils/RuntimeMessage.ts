import Browser from 'webextension-polyfill';
import { isObject } from './helper';
import { SearchDictWordResult } from '../pages/background/messageHandler/dictWordSearcher';
import { CursorPoint } from '../pages/content/content-handler/TextSearcher';
import { SetRequired } from 'type-fest';
import { ClientRect } from '../interface/shared.interface';

export interface WordFrameSource {
  frameURL: string;
  rect?: ClientRect;
  point: CursorPoint;
}
export interface MessageSearchWordOpts {
  input: string;
  maxResult?: number;
  frameSource?: WordFrameSource;
}

interface Events {
  'background:search-word': (
    detail: MessageSearchWordOpts,
  ) => SearchDictWordResult;
  'background:search-word-iframe': (
    detail: SetRequired<MessageSearchWordOpts, 'frameSource'>,
  ) => SearchDictWordResult;
  'content:iframe-word-result': (
    result: SearchDictWordResult & { frameSource: WordFrameSource },
  ) => void;
}

type EventListener = Map<string, (...args: unknown[]) => unknown>;

export interface RuntimeMessagePayload {
  args: unknown[];
  name: keyof Events;
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

  onMessage<T extends keyof Events>(
    name: T,
    callback: (
      ...args: [...Parameters<Events[T]>, Browser.Runtime.MessageSender]
    ) => ReturnType<Events[T]> extends void
      ? void
      : Promise<ReturnType<Events[T]>>,
  ) {
    this.eventListeners.set(name, callback);

    return this.onMessage;
  }

  sendMessage<T extends keyof Events>(name: T, ...args: Parameters<Events[T]>) {
    return Browser.runtime.sendMessage({ name, args }) as Promise<
      ReturnType<Events[T]>
    >;
  }

  sendMessageToTab<T extends keyof Events>(
    { name, tabId, frameId }: { name: T; tabId: number; frameId?: number },
    ...args: Parameters<Events[T]>
  ) {
    return Browser.tabs.sendMessage(
      tabId,
      { name, args },
      { frameId },
    ) as Promise<ReturnType<Events[T]>>;
  }
}

export default new RuntimeMessage();
