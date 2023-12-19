import { DICTIONARY_NAME } from '../shared/constant/constant';

export interface BookmarkItem {
  id: string;
  note?: string;
  folderId?: string;
  type: DICTIONARY_NAME;
}

export interface BoomarkFolder {
  id: string;
  name: string;
}
