import Dexie, { IndexableType } from 'dexie';
import {
  DictKanjiEntry,
  DictKanjiVGEntry,
  DictMetadata,
  DictNameEntry,
  DictSearchOptions,
  DictWordEntry,
} from '@src/interface/dict.interface';
import { DICTIONARY_NAME } from '../constant/constant';

export interface DictSearchKanjiOptions
  extends Omit<DictSearchOptions, 'input'> {
  by: 'reading' | 'id';
  input: IndexableType;
}

export interface DictSearchKanjiVgOptions {
  input: number | number[];
}

export const DICTIONARY_TABLE_NAME_MAP = {
  [DICTIONARY_NAME.JMDICT]: 'words',
  [DICTIONARY_NAME.KANJIDIC]: 'kanji',
  [DICTIONARY_NAME.ENAMDICT]: 'names',
  [DICTIONARY_NAME.KANJIVG]: 'kanjivg',
} as const;

class DictDB extends Dexie {
  words!: Dexie.Table<DictWordEntry, number>;
  names!: Dexie.Table<DictNameEntry, number>;
  kanji!: Dexie.Table<DictKanjiEntry, number>;
  kanjivg!: Dexie.Table<DictKanjiVGEntry, number>;
  metadata!: Dexie.Table<
    { id: `${DICTIONARY_NAME}`; metadata: DictMetadata },
    `${DICTIONARY_NAME}`
  >;

  constructor() {
    super('dictionaries');
    this.version(1).stores({
      kanjivg: 'id',
      metadata: 'id',
      names: 'id, *kanji, *reading',
      words: 'id, *kanji, *reading, *kToken',
      kanji: 'id, *reading.ja_on, *reading.ja_kun',
    });
  }

  async searchWord({ input, maxResult, matchWhole = true }: DictSearchOptions) {
    let result: DictWordEntry[] = [];

    if (!matchWhole) {
      const inputArr = Array.isArray(input) ? input : [input];
      result = await this.words
        .where('reading')
        .startsWithAnyOf(inputArr)
        .or('kanji')
        .startsWithAnyOf(inputArr)
        .limit(maxResult)
        .toArray();
    } else {
      result = await this.words
        .where('reading')
        .anyOf(input)
        .or('kanji')
        .anyOf(input)
        .limit(maxResult)
        .toArray();
    }

    return result;
  }

  async searchNames({
    input,
    maxResult,
    matchWhole = true,
  }: DictSearchOptions) {
    let result: DictNameEntry[] = [];

    if (!matchWhole) {
      const inputArr = Array.isArray(input) ? input : [input];
      result = await this.names
        .where('reading')
        .startsWithAnyOf(inputArr)
        .or('kanji')
        .startsWithAnyOf(inputArr)
        .limit(maxResult)
        .toArray();
    } else {
      result = await this.names
        .where('reading')
        .anyOf(input)
        .or('kanji')
        .anyOf(input)
        .limit(maxResult)
        .toArray();
    }

    return result;
  }

  async searchKanji({
    input,
    maxResult,
    by: searchBy,
  }: DictSearchKanjiOptions) {
    let result: DictKanjiEntry[];
    if (searchBy === 'reading') {
      result = await this.kanji
        .where('reading.ja_on')
        .equals(input)
        .or('reading.ja_kun')
        .equals(input)
        .or('reading.nanori')
        .equals(input)
        .limit(maxResult)
        .toArray();
    } else if (searchBy === 'id') {
      if (Array.isArray(input)) {
        result = (await this.kanji.bulkGet(
          input as unknown as number[],
        )) as DictKanjiEntry[];
      } else {
        const kanji = await this.kanji.get(+input);
        result = kanji ? [kanji] : [];
      }
    }

    return result!;
  }

  async searchKanjiVG({ input }: DictSearchKanjiVgOptions) {
    if (Array.isArray(input)) {
      return await this.kanjivg.bulkGet(input);
    }

    const result = await this.kanjivg.get(input);

    return result ? [result] : [];
  }
}

const dictDB = new DictDB();

export default dictDB;
