import { MessageSearchOpts } from '@root/src/utils/RuntimeMessage';
import { isObject } from '@root/src/utils/helper';

interface Events {
  'window:search-word': (detail: MessageSearchOpts) => void;
}

type EventListener = Record<string, ((...args: unknown[]) => unknown)[]>;

export interface WindowMessagePayload {
  args: unknown[];
  name: keyof Events;
}

class WindowMessage {
  private eventListeners: EventListener;

  constructor() {
    this.eventListeners = {};

    this.init();
  }

  private init() {
    window.addEventListener('message', ({ data: message }) => {
      if (!isObject(message) || !Object.hasOwn(message, 'name')) return;

      const callbacks = this.eventListeners[message.name];
      if (!callbacks) return;

      callbacks.forEach((callback) => {
        callback(...(message.args ?? [])) as Promise<unknown>;
      });
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
    if (!this.eventListeners[name]) {
      this.eventListeners[name] = [];
    }
    this.eventListeners[name].push(callback);

    return this.onMessage;
  }

  sendMessage<T extends keyof Events>(name: T, ...args: Parameters<Events[T]>) {
    window.top.postMessage({ name, args }, '*');
  }
}

export default new WindowMessage();
