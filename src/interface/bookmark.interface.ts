import { DICTIONARY_NAME } from '../shared/constant/constant';
import { DictEntryMap } from './dict.interface';

export type BookmarkItemStatus = 'learn' | 'know' | 'learned';

export interface BookmarkItem<T extends DICTIONARY_NAME = DICTIONARY_NAME> {
  type: T;
  id?: number;
  note?: string;
  entryId: number;
  kanji?: string[];
  reading: string[];
  meaning: string[];
  createdAt: string;
  entry?: DictEntryMap[T];
  status: BookmarkItemStatus;
  folderId?: string[] | null;
}

export interface BoomarkFolder {
  id: string;
  name: string;
}
