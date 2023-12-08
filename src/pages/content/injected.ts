import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import ContentHandler, {
  contentEventEmitter,
} from './content-handler/ContentHandler';
import { isInMainFrame } from './content-handler/content-handler-utils';

if (isInMainFrame()) {
  RuntimeMessage.onMessage('content:iframe-word-result', (searchResult) => {
    console.log('halo', searchResult);
    contentEventEmitter.emit('search-word-result', {
      entry: searchResult,
      point: searchResult.frameSource.point,
      frameSource: searchResult.frameSource,
    });
  });
}

(() => {
  new ContentHandler();
})();
