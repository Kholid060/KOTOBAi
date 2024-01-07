import { DICTIONARY_NAME } from '../shared/constant/constant';
import { DictEntryMap } from './dict.interface';

export enum BOOKMARK_ITEM_STATUS {
  KNOW = 'know',
  LEARN = 'learn',
  LEARNED = 'learned',
}

export type BookmarkItemStatus = `${BOOKMARK_ITEM_STATUS}`;

export interface BookmarkItem<T extends DICTIONARY_NAME = DICTIONARY_NAME> {
  type: T;
  id: number;
  note?: string;
  ankiId?: number;
  entryId: number;
  kanji?: string[];
  reading: string[];
  meaning: string[];
  createdAt: string;
  lastReviewedAt: string;
  entry?: DictEntryMap[T];
  status: BookmarkItemStatus;
  folderId?: string[] | null;
}

export interface BoomarkFolder {
  id: string;
  name: string;
}
