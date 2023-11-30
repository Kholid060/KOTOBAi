import Browser from 'webextension-polyfill';
import { isObject } from './helper';
import { SearchDictWordResult } from '../pages/background/messageHandler/dictWordSearcher';

export interface MessageSearchWordOpts {
  input: string;
  maxResult?: number;
}

interface Events {
  'background:search-word': (
    detail: MessageSearchWordOpts,
  ) => SearchDictWordResult;
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
    Browser.runtime.onMessage.addListener((message) => {
      if (!isObject(message) || !Object.hasOwn(message, 'name')) return;

      const callback = this.eventListeners.get(message.name);
      if (!callback) return;

      return callback(...(message.args ?? [])) as Promise<unknown>;
    });
  }

  onMessage<T extends keyof Events>(
    name: T,
    callback: (
      ...args: Parameters<Events[T]>
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
