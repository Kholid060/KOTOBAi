import { memo, useEffect, useState } from 'react';
import SharedBookmarkBtnBase, { SharedBookmarkBtnProps } from './Base';
import bookmarkDb from '@root/src/shared/db/bookmark.db';

function SharedBookmarkBtnMain({
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

    bookmarkDb
      .toggleBookmark(
        {
          id: entry.id,
          type: entry.type,
        },
        newValue,
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
        const bookmarkItem = await bookmarkDb.getBookmark(bookmarkId);
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

export default memo(SharedBookmarkBtnMain);
