import WordContainer from './WordContainer';

export default function App() {
  // useEventListener('mousemove', debounce(({ target, clientX, clientY }) => {
  //   const range = caretPositionFromPoint(clientX, clientY);
  //   if (!range) return;

  //   const startNode = range.startContainer;
  //   const text = startNode.textContent.slice(range.startOffset, range.startOffset + MAX_TEXT_LEN);
  //   if (!JP_CHARS_REGEX.test(text)) return;

  //   console.log(text);
  // }, 500));

  return (
    <div className="font-sans dark text-foreground">
      <WordContainer />
    </div>
  );
}
