import { IndexableType } from 'dexie';
import { DictKanjiEntry, DictLoadState } from '../interface/dict.interface';
import dictDB from '../shared/db/dict.db';
import dictStateStorage from '../shared/storages/dictStateStorage';
import DictLoader from './DictLoader';

export interface DictSearchOptions {
  input: string;
  maxResult: number;
}

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

  async searchWord({ input, maxResult }: DictSearchOptions) {
    const result = await dictDB.words
      .where('reading')
      .equals(input)
      .or('kanji')
      .equals(input)
      .limit(maxResult)
      .toArray();

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
      console.log('ID', input);
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
