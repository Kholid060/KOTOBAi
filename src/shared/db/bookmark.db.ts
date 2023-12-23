import Dexie from 'dexie';
import { BookmarkItem } from '../../interface/bookmark.interface';

export type BookmarkIdPayload =
  | BookmarkItem['id']
  | BookmarkItem['id'][]
  | Pick<BookmarkItem, 'type' | 'entryId'>;

export type BookmarkAddPayload = Pick<
  BookmarkItem,
  'type' | 'folderId' | 'kanji' | 'meaning' | 'reading' | 'note' | 'entryId'
>;

class BookmarkDb extends Dexie {
  items!: Dexie.Table<BookmarkItem, number>;

  constructor() {
    super('bookmarks');
    this.version(1).stores({
      folders: '++id',
      items: '++id, type, entryId, *folderId, status, lastReviewedAt',
    });
  }

  addBookmark(payload: BookmarkAddPayload) {
    return this.items.put({
      ...payload,
      status: 'learn',
      createdAt: new Date().toString(),
      lastReviewedAt: new Date().toString(),
    });
  }

  async getBookmarks(ids: BookmarkIdPayload) {
    if (Array.isArray(ids)) return this.items.bulkGet(ids);
    if (typeof ids === 'number') return [await this.items.get(ids)];

    return this.items.where(ids).toArray();
  }

  async removeBookmarks(ids: BookmarkIdPayload) {
    if (Array.isArray(ids)) return this.items.bulkDelete(ids);
    if (typeof ids === 'number') return [await this.items.delete(ids)];

    return this.items.where(ids).delete();
  }
}

const bookmarkDB = new BookmarkDb();

export default bookmarkDB;
