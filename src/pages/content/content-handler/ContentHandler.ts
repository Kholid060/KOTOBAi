import { debounce } from '@root/src/utils/helper';
import { getCursorText } from './get-cursor-text';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';

const MAX_CONTENT_LENGTH = 16;

class ContentHandler {
  constructor() {
    this.onPointerMove = debounce(this.onPointerMove.bind(this), 100);

    this.attachListener();
  }

  private attachListener() {
    console.log(this.onPointerMove);
    window.addEventListener('pointermove', this.onPointerMove);
  }

  private onPointerMove(event: PointerEvent) {
    const cursorPoint = { x: event.clientX, y: event.clientY };
    const result = getCursorText({
      point: cursorPoint,
      maxLength: MAX_CONTENT_LENGTH,
      element: <Element>event.target,
    });
    if (!result) return;

    RuntimeMessage.sendMessage('background:search-word', {
      input: result.text,
    }).then((searchResult) => {
      console.log(searchResult);
    });
  }
}

export default ContentHandler;
