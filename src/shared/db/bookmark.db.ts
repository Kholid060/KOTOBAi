import Dexie from 'dexie';
import { DICTIONARY_NAME } from '../constant/constant';

export interface BookmarkItem {
  id: string;
  note?: string;
  type: DICTIONARY_NAME;
}

type BookmarkIdPayload = string | { id: number; type: DICTIONARY_NAME };
type BookmarkPayload = Omit<BookmarkItem, 'id'> & { id: BookmarkIdPayload };

const getBookmarkId = (payload: BookmarkIdPayload) =>
  typeof payload === 'string' ? payload : `${payload.type}:${payload.id}`;
const getBookmarkItem = ({ id, ...detail }: BookmarkPayload) => ({
  id: getBookmarkId(id),
  ...detail,
});

class BookmarkDb extends Dexie {
  items!: Dexie.Table<BookmarkItem, string>;

  constructor() {
    super('bookmarks');
    this.version(1).stores({
      items: 'id, type',
    });
  }

  addBookmark(payload: BookmarkPayload) {
    return this.items.put(getBookmarkItem(payload));
  }

  deleteBookmark(payload: BookmarkIdPayload) {
    return this.items.delete(getBookmarkId(payload));
  }

  getBookmark(id: BookmarkIdPayload) {
    return this.items.get(getBookmarkId(id));
  }

  async toggleBookmark(payload: BookmarkPayload, force?: boolean) {
    const item = getBookmarkItem(payload);

    const isExists =
      typeof force === 'boolean' ? !force : await this.items.get(item.id);
    if (isExists) {
      await this.items.delete(item.id);
      return false;
    }

    await this.items.add(item);

    return true;
  }
}

const bookmarkDb = new BookmarkDb();

export default bookmarkDb;
