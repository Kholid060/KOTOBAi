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

  async function toggleBookmark() {
    try {
      setIsLoading(true);

      const newValue = !isBookmarked;
      if (newValue) {
        await bookmarkDb.addBookmark({
          type: entry.type,
          entryId: entry.id,
          kanji: entry.kanji,
          meaning: entry.meaning,
          reading: entry.reading,
        });
      } else {
        await bookmarkDb.removeBookmarks({
          entryId: entry.id,
          type: entry.type,
        });
      }

      onValueChange?.(newValue);
      setIsBookmarked(newValue);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const bookmarkItem = await bookmarkDb.getBookmarks(bookmarkId);
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
