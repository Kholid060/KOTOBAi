import { DictLoadState } from '../interface/dict.interface';
import dictDB from '../shared/db/dict.db';
import dictStateStorage from '../shared/storages/dictStateStorage';
import DictLoader from './DictLoader';

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

  async searchWord(input: string) {
    const result = await dictDB.words
      .where('reading')
      .equals(input)
      .or('kanji')
      .equals(input)
      .limit(7)
      .toArray();

    return result;
  }
}

export default Dictionary;
