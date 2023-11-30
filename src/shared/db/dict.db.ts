import Dexie from 'dexie';
import {
  DictKanjiEntry,
  DictMetadata,
  DictNameEntry,
  DictWordEntry,
  KanjiDictMetadata,
} from '@src/interface/dict.interface';
import { DICTIONARY_NAME } from '../constant/constant';

class DictDB extends Dexie {
  words!: Dexie.Table<DictWordEntry, number>;
  names!: Dexie.Table<DictNameEntry, number>;
  kanji!: Dexie.Table<DictKanjiEntry, number>;
  metadata!: Dexie.Table<
    { id: `${DICTIONARY_NAME}`; metadata: DictMetadata | KanjiDictMetadata },
    `${DICTIONARY_NAME}`
  >;

  constructor() {
    super('dictionaries');
    this.version(1).stores({
      metadata: 'id',
      words: 'id, *kanji, *reading',
      names: 'id, *kanji, *reading',
      kanji: 'id, *reading.ja_on, *reading.ja_kun, *reading.nanori',
    });
  }

  getDictMetadata() {}
}

const dictDB = new DictDB();

export default dictDB;
