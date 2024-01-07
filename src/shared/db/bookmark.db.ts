import Dexie from 'dexie';
import { BookmarkItem } from '../../interface/bookmark.interface';
import { SetOptional } from 'type-fest';
import AnkiApi from '@root/src/utils/anki-api';
import extSettingsStorage from '../storages/extSettingsStorage';

export type BookmarkIdPayload =
  | BookmarkItem['id']
  | BookmarkItem['id'][]
  | Pick<BookmarkItem, 'type' | 'entryId'>;

export type BookmarkAddPayload = Pick<
  BookmarkItem,
  'type' | 'folderId' | 'kanji' | 'meaning' | 'reading' | 'note' | 'entryId'
>;

export function formatBookmarkToAnkiNote({
  kanji,
  meaning,
  reading,
}: BookmarkAddPayload) {
  const formattedMeaning = meaning.map((item) => `<li>${item}</li>`);

  return {
    notes: '',
    reading: kanji ? reading.join('、') : '',
    meaning: `<ul>${formattedMeaning.join('')}</ul>`,
    expression: (kanji ? kanji : reading).join('、'),
  };
}

class BookmarkDb extends Dexie {
  items!: Dexie.Table<SetOptional<BookmarkItem, 'id'>, number>;

  constructor() {
    super('bookmarks');
    this.version(1).stores({
      folders: '++id',
      items: '++id, type, entryId, *folderId, status, lastReviewedAt',
    });
  }

  async addBookmark(payload: BookmarkAddPayload) {
    const settings = await extSettingsStorage.get();

    let ankiId: number | undefined;
    if (settings.anki.enabled) {
      const { result } = await AnkiApi.instance.addNotes(
        formatBookmarkToAnkiNote(payload),
      );
      if (result?.[0]) ankiId = result[0];
    }

    return await this.items.put({
      ...payload,
      ankiId,
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
    const settings = await extSettingsStorage.get();
    if (settings.anki.enabled) {
      const bookmarks = await this.getBookmarks(ids);
      const ankiIds: number[] = [];

      bookmarks.forEach((bookmark) => {
        if (bookmark?.ankiId) ankiIds.push(bookmark.ankiId);
      });

      if (ankiIds.length > 0) await AnkiApi.instance.deleteNotes(ankiIds);
    }

    if (Array.isArray(ids)) return this.items.bulkDelete(ids);
    if (typeof ids === 'number') return [await this.items.delete(ids)];

    return this.items.where(ids).delete();
  }
}

const bookmarkDB = new BookmarkDb();

export default bookmarkDB;
