import { useLiveQuery } from 'dexie-react-hooks';
import UiCard from '../ui/card';
import bookmarkDB from '@root/src/shared/db/bookmark.db';
import {
  BookmarkItem,
  BookmarkItemStatus,
} from '@root/src/interface/bookmark.interface';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { UiButton } from '../ui/button';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import UiInput from '../ui/input';
import UiSelect from '../ui/select';
import Dexie from 'dexie';
import { useDebounce } from 'usehooks-ts';
import { Link } from 'react-router-dom';
import { DICTIONARY_TABLE_NAME_MAP } from '@root/src/shared/db/dict.db';

const BOOKMARK_ITEM_STATUS: Record<
  BookmarkItemStatus,
  { name: string; class: string; id: BookmarkItemStatus }
> = {
  learn: {
    id: 'learn',
    name: 'To learn',
    class: 'text-amber-600 dark:text-amber-500',
  },
  learned: {
    id: 'learned',
    name: 'Learned',
    class: 'text-emerald-500 dark:text-emerald-400',
  },
  know: {
    id: 'know',
    name: 'Know',
    class: 'text-primary',
  },
};

function BookmarksTable({ bookmarks }: { bookmarks: BookmarkItem[] }) {
  function updateBookmark(
    bookmarkId: BookmarkItem['id'],
    newVal: Partial<Omit<BookmarkItem, 'id'>>,
  ) {
    if (!bookmarkId) return;
    bookmarkDB.items.update(bookmarkId, newVal);
  }

  return (
    <div className="rounded-md border border-border/70 overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-border/70">
          {bookmarks.map((bookmark) => (
            <tr key={bookmark.id} className="hover:bg-muted/50 group">
              <td className="font-sans-jp p-3 max-w-[12rem]">
                <Link
                  to={`/${DICTIONARY_TABLE_NAME_MAP[bookmark.type]}/${
                    bookmark.entryId
                  }`}
                >
                  <p className="dark:text-indigo-400 line-clamp-1 text-indigo-600 leading-tight">
                    {bookmark.kanji?.join('、')}
                  </p>
                  <p className="dark:text-emerald-400 line-clamp-1 text-emerald-700 leading-tight">
                    {bookmark.reading.join('、')}
                  </p>
                </Link>
              </td>
              <td className="max-w-[12rem] first-letter:capitalize text-muted-foreground p-3">
                <p className="line-clamp-2">{bookmark.meaning.join('; ')}</p>
              </td>
              <td className="max-w-[12rem] first-letter:capitalize text-center text-sm p-3">
                <select
                  value={bookmark.status}
                  className={cn(
                    'p-1 rounded-sm bg-transparent border hover:bg-muted/50',
                    BOOKMARK_ITEM_STATUS[bookmark.status].class,
                  )}
                  onChange={(event) => {
                    updateBookmark(bookmark.id, {
                      status: event.target.value as BookmarkItemStatus,
                    });
                  }}
                >
                  <option value="" disabled className="bg-background">
                    Status
                  </option>
                  {Object.values(BOOKMARK_ITEM_STATUS).map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      className="bg-background text-foreground"
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-4 text-right align-bottom">
                <button
                  className="text-red-500 group-hover:visible invisible"
                  onClick={() => bookmarkDB.items.delete(bookmark.id!)}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SHOW_BOOKMARK_LIMIT = 10;

const arrayStringSearch = (items: string[], query: string) =>
  items.some((item) => item.includes(query));

function DashboardBookmarkList(props: React.HTMLAttributes<HTMLDivElement>) {
  const [page, setPage] = useState(0);
  const [statusFilter, setstatusFilter] = useState<BookmarkItemStatus | 'all'>(
    'all',
  );
  const [query, setQuery] = useState('');

  const debounceQuery = useDebounce(query, 500);

  const [bookmarksCount, bookmarks] = useLiveQuery(() => {
    let query: Dexie.Collection | Dexie.Table = bookmarkDB.items;
    if (statusFilter !== 'all') query = query.where({ status: statusFilter });
    if (debounceQuery.trim())
      query = query.filter(
        (item) =>
          arrayStringSearch(item.reading, debounceQuery) ||
          arrayStringSearch(item.kanji ?? [], debounceQuery) ||
          arrayStringSearch(item.meaning, debounceQuery.toLowerCase()),
      );

    const result = query
      .reverse()
      .offset(SHOW_BOOKMARK_LIMIT * page)
      .limit(SHOW_BOOKMARK_LIMIT)
      .toArray();

    return Promise.all([query.count(), result]);
  }, [page, statusFilter, debounceQuery]) ?? [0];

  const maxPage = Math.ceil(bookmarksCount / SHOW_BOOKMARK_LIMIT);

  return (
    <UiCard {...props}>
      <UiCard.Header className="flex items-center flex-row gap-4">
        <p className="font-semibold">Bookmarks</p>
        <div className="flex-grow"></div>
        <UiInput
          value={query}
          className="w-56"
          placeholder="Search..."
          onChange={(event) => setQuery(event.target.value)}
        />
        <UiSelect
          value={statusFilter}
          className="w-auto"
          onValueChange={(value) =>
            setstatusFilter(value as BookmarkItemStatus)
          }
        >
          <UiSelect.Option value="all">All status</UiSelect.Option>
          {Object.values(BOOKMARK_ITEM_STATUS).map((item) => (
            <UiSelect.Option key={item.id} value={item.id}>
              {item.name}
            </UiSelect.Option>
          ))}
        </UiSelect>
        <UiButton variant="secondary">Export</UiButton>
      </UiCard.Header>
      <UiCard.Content>
        {bookmarks ? (
          <BookmarksTable bookmarks={bookmarks} />
        ) : (
          <p className="text-center">No data</p>
        )}
      </UiCard.Content>
      <UiCard.Footer className="flex items-center justify-end">
        <p className="text-muted-foreground tabular-nums">
          page {page + 1} out of {maxPage}
        </p>
        <UiButton
          className="ml-8"
          variant="outline"
          disabled={page <= 0}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </UiButton>
        <UiButton
          variant="outline"
          className="ml-2"
          disabled={page >= maxPage - 1}
          onClick={() => setPage(page + 1)}
        >
          Next
        </UiButton>
      </UiCard.Footer>
    </UiCard>
  );
}

export default DashboardBookmarkList;
