import { IndexableType } from 'dexie';
import {
  DictKanjiEntry,
  DictLoadState,
  DictNameEntry,
  DictSearchOptions,
  DictWordEntry,
} from '../interface/dict.interface';
import dictDB from '../shared/db/dict.db';
import dictStateStorage from '../shared/storages/dictStateStorage';
import DictLoader from './DictLoader';

export interface DictSearchKanjiOptions
  extends Omit<DictSearchOptions, 'input'> {
  by: 'reading' | 'id';
  input: IndexableType;
}

class Dictionary {
  loadState: DictLoadState;

  constructor() {
    this.loadState = 'not_loaded';

    this._init();
  }

  private async _init() {
    const updateState = (state: DictLoadState) => {
      this.loadState = state;
      return dictStateStorage.update({ state });
    };

    try {
      const dictState = await dictStateStorage.get();
      this.loadState = dictState.state;

      if (this.loadState === 'loaded' || this.loadState === 'loading_data')
        return;

      await updateState('loading_data');

      await DictLoader.loadAllDictionaries();

      await updateState('loaded');
    } catch (error) {
      console.error(error);
      await updateState('not_loaded');
    }
  }

  async searchWord({ input, maxResult, matchWhole = true }: DictSearchOptions) {
    let result: DictWordEntry[] = [];

    if (!matchWhole) {
      const inputArr = Array.isArray(input) ? input : [input];
      result = await dictDB.words
        .where('reading')
        .startsWithAnyOf(inputArr)
        .or('kanji')
        .startsWithAnyOf(inputArr)
        .limit(maxResult)
        .toArray();
    } else {
      result = await dictDB.words
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
      result = await dictDB.names
        .where('reading')
        .startsWithAnyOf(inputArr)
        .or('kanji')
        .startsWithAnyOf(inputArr)
        .limit(maxResult)
        .toArray();
    } else {
      result = await dictDB.names
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
      result = await dictDB.kanji
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
        result = await dictDB.kanji.bulkGet(input as unknown as number[]);
      } else {
        const kanji = await dictDB.kanji.get(+input);
        result = kanji ? [kanji] : [];
      }
    }

    return result;
  }
}

export default Dictionary;
