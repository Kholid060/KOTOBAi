import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import ContentHandler, {
  contentEventEmitter,
} from './content-handler/ContentHandler';
import { isInMainFrame } from './content-handler/content-handler-utils';
import disableExtStorage from '@root/src/shared/storages/disableExtStorage';

const IS_MAIN_FRAME = isInMainFrame();
let contentHandler: ContentHandler | null = null;

function contentMessageListener() {
  if (IS_MAIN_FRAME) {
    RuntimeMessage.onMessage('content:iframe-word-result', (searchResult) => {
      console.log(searchResult);
      contentEventEmitter.emit('search-word-result', {
        entry: searchResult,
        point: searchResult.frameSource.point,
        frameSource: searchResult.frameSource,
      });
    });
  }

  RuntimeMessage.onMessage('content:disable-ext-state', (isDisabled) => {
    contentEventEmitter.emit('disable-state-change', isDisabled);

    if (!isDisabled) {
      if (!contentHandler) contentHandler = new ContentHandler();
      else contentHandler.disabled = false;

      return;
    }

    if (contentHandler) contentHandler.disabled = true;
  });
}

(async () => {
  try {
    contentMessageListener();

    const disableState = await disableExtStorage.get();
    const disabledByHost = disableState.hostList.includes(
      window.location.hostname,
    );
    if (disableState.disabled || disabledByHost) {
      if (disabledByHost && IS_MAIN_FRAME) {
        RuntimeMessage.sendMessage('background:set-disabled-badge');
      }

      return;
    }

    contentHandler = new ContentHandler();
  } catch (error) {
    console.error(error);
  }
})();
