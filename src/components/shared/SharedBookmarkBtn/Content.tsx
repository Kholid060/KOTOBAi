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

  function toggleBookmark() {
    setIsLoading(true);

    const newValue = !isBookmarked;

    RuntimeMessage.sendMessage(
      'background:bookmark-toggle',
      {
        type: entry.type,
        entryId: entry.id,
        kanji: entry.kanji,
        meaning: entry.meaning,
        reading: entry.reading,
      },
      !isBookmarked,
    )
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
          { entryId: entry.id, type: entry.type },
          true,
        );

        setIsBookmarked(Boolean(bookmarkItem));
      } catch (error) {
        console.error(error);
      }
    })();
  }, [entry]);

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
