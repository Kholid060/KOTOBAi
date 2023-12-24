import { memo, useEffect, useState } from 'react';
import SharedBookmarkBtnBase, { SharedBookmarkBtnProps } from './Base';
import bookmarkDB from '@root/src/shared/db/bookmark.db';

function SharedBookmarkBtnMain({
  entry,
  onClick,
  onValueChange,
  ...props
}: SharedBookmarkBtnProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  async function toggleBookmark() {
    try {
      setIsLoading(true);

      const newValue = !isBookmarked;
      if (newValue) {
        await bookmarkDB.addBookmark({
          type: entry.type,
          entryId: entry.id,
          kanji: entry.kanji,
          meaning: entry.meaning,
          reading: entry.reading,
        });
      } else {
        await bookmarkDB.removeBookmarks({
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
        const [bookmarkItem] = await bookmarkDB.getBookmarks({
          entryId: entry.id,
          type: entry.type,
        });
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

export default memo(SharedBookmarkBtnMain);
