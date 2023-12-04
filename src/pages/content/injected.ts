import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import ContentHandler, {
  contentEventEmitter,
} from './content-handler/ContentHandler';

RuntimeMessage.onMessage('content:iframe-word-result', (searchResult) => {
  contentEventEmitter.emit('search-word-result', {
    entry: searchResult,
    point: searchResult.frameSource.point,
    frameSource: searchResult.frameSource,
  });
});

(() => {
  new ContentHandler();
})();
