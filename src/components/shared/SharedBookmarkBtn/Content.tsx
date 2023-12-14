import { memo, useEffect, useState } from 'react';
import SharedBookmarkBtnBase, { SharedBookmarkBtnProps } from './Base';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';

function SharedBookmarkBtnContent({
  entry,
  onClick,
  onValueChange,
  ...props
}: SharedBookmarkBtnProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const bookmarkId = `${entry.type}:${entry.id}`;

  function toggleBookmark() {
    setIsLoading(true);

    const newValue = !isBookmarked;

    RuntimeMessage.sendMessage('background:bookmark-toggle', {
      id: entry.id,
      value: newValue,
      type: entry.type,
    })
      .then(() => {
        onValueChange?.(newValue);
        setIsBookmarked(newValue);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    (async () => {
      try {
        const bookmarkItem = await RuntimeMessage.sendMessage(
          'background:bookmark-get',
          bookmarkId,
        );

        setIsBookmarked(Boolean(bookmarkItem));
      } catch (error) {
        console.error(error);
      }
    })();
  }, [bookmarkId]);

  return (
    <SharedBookmarkBtnBase
      disabled={isLoading}
      isBookmarked={isBookmarked}
      onClick={(event) => {
        onClick?.(event);
        toggleBookmark();
      }}
      {...props}
    />
  );
}

export default memo(SharedBookmarkBtnContent);
