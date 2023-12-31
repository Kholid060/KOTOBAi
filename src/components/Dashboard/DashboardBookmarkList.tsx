import { useLiveQuery } from 'dexie-react-hooks';
import UiCard from '../ui/card';
import bookmarkDB from '@root/src/shared/db/bookmark.db';
import {
  BookmarkItem,
  BookmarkItemStatus,
} from '@root/src/interface/bookmark.interface';
import { FileDownIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { UiButton } from '../ui/button';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import UiInput from '../ui/input';
import UiSelect from '../ui/select';
import Dexie from 'dexie';
import { useDebounce } from 'usehooks-ts';
import { Link } from 'react-router-dom';
import { DICTIONARY_TABLE_NAME_MAP } from '@root/src/shared/db/dict.db';
import UiPopover from '../ui/popover';
import dayjs from 'dayjs';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { capitalize } from 'lodash-es';

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
const BOOKMARK_EXPORT_PERDIOD = [
  { id: 'all', day: Infinity, name: 'All' },
  { id: 'last-day', day: 1, name: 'Last day' },
  { id: 'last-week', day: 7, name: 'Last week' },
  { id: 'last-month', day: 30, name: 'Last month' },
] as const;

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
              <td className="first-letter:capitalize text-muted-foreground p-3">
                {DICTIONARY_TABLE_NAME_MAP[bookmark.type]}
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

interface ExportFilter {
  period: string;
  type: DICTIONARY_NAME | 'all';
  status: BookmarkItemStatus | 'all';
}

function BookmarkExport() {
  const [filter, setFilter] = useState<ExportFilter>({
    type: 'all',
    period: 'all',
    status: 'all',
  });

  async function exportBookmark() {
    try {
      let bookmarksQuery: Dexie.Table | Dexie.Collection = bookmarkDB.items;
      if (filter.status !== 'all') {
        bookmarksQuery = bookmarksQuery.where('status').equals(filter.status);
      }
      if (filter.type !== 'all') {
        if ('or' in bookmarksQuery) {
          bookmarksQuery = bookmarksQuery.or('type').equals(filter.type);
        } else {
          bookmarksQuery = bookmarksQuery.where('type').equals(filter.type);
        }
      }
      if (filter.period !== 'all') {
        const period = BOOKMARK_EXPORT_PERDIOD.find(
          (item) => item.id === filter.period,
        );
        const date = dayjs()
          .subtract(period?.day ?? 30, 'day')
          .toDate();
        bookmarksQuery = bookmarksQuery.filter(
          (bookmark) => new Date(bookmark.createdAt) >= date,
        );
      }

      const bookmarks = (await bookmarksQuery.toArray()) as BookmarkItem[];
      if (bookmarks.length === 0) {
        alert('No bookmarks to export with the current filter.');
        return;
      }

      const tabOrEmpty = (val: unknown) => (val ? `${val}\t` : ' \t');
      const mappedBookmarks = bookmarks.map(
        ({ entryId, type, kanji, reading, meaning }) =>
          `${type}_${entryId}\t${tabOrEmpty(kanji?.join('、'))}${tabOrEmpty(
            reading.join('、'),
          )}"${meaning.join('\n')}"`,
      );

      const blob = new Blob([mappedBookmarks.join('\n')], {
        type: 'text/tab-separated-values',
      });

      const anchorEl = document.createElement('a');
      anchorEl.download = 'jp-bookmarks.tsv';
      anchorEl.href = URL.createObjectURL(blob);

      document.body.appendChild(anchorEl);

      anchorEl.click();
      anchorEl.remove();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <UiPopover>
      <UiPopover.Trigger asChild>
        <UiButton variant="secondary">
          <FileDownIcon className="h-5 w-5 mr-2 -ml-1" />
          <span>Export</span>
        </UiButton>
      </UiPopover.Trigger>
      <UiPopover.Content>
        <p className="font-semibold">Export bookmarks</p>
        <div className="grid grid-cols-3 items-center mt-4 gap-4">
          <span>Status</span>
          <UiSelect
            value={filter.status}
            onValueChange={(value) =>
              setFilter((prevState) => ({
                ...prevState,
                status: value as ExportFilter['status'],
              }))
            }
            className="col-span-2"
            size="sm"
          >
            <UiSelect.Option value="all">All</UiSelect.Option>
            {Object.values(BOOKMARK_ITEM_STATUS).map((status) => (
              <UiSelect.Option key={status.id} value={status.id}>
                {status.name}
              </UiSelect.Option>
            ))}
          </UiSelect>
          <span>Type</span>
          <UiSelect
            size="sm"
            className="col-span-2"
            value={filter.type}
            onValueChange={(value) =>
              setFilter((prevState) => ({
                ...prevState,
                type: value as ExportFilter['type'],
              }))
            }
          >
            <UiSelect.Option value="all">All</UiSelect.Option>
            {[
              DICTIONARY_NAME.JMDICT,
              DICTIONARY_NAME.KANJIDIC,
              DICTIONARY_NAME.ENAMDICT,
            ].map((type) => (
              <UiSelect.Option key={type} value={type}>
                {capitalize(DICTIONARY_TABLE_NAME_MAP[type])}
              </UiSelect.Option>
            ))}
          </UiSelect>
          <span>Period</span>
          <UiSelect
            size="sm"
            className="col-span-2"
            value={filter.period}
            onValueChange={(value) =>
              setFilter((prevState) => ({
                ...prevState,
                period: value,
              }))
            }
          >
            {BOOKMARK_EXPORT_PERDIOD.map((period) => (
              <UiSelect.Option key={period.id} value={period.id}>
                {period.name}
              </UiSelect.Option>
            ))}
          </UiSelect>
        </div>
        <UiButton className="mt-6 w-full" onClick={exportBookmark}>
          Export
        </UiButton>
      </UiPopover.Content>
    </UiPopover>
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
        <BookmarkExport />
      </UiCard.Header>
      <UiCard.Content>
        {bookmarks?.length ? (
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
