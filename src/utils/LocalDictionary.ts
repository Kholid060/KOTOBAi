import {
  DictSearchOptions,
  DictWordLocalEntry,
} from '../interface/dict.interface';
import { api } from './api';
import { parseJSON } from './helper';

class LocalDictionary {
  words: string;
  wordsIndex: Record<string, number[]>;

  isLoaded: boolean;

  constructor({ autoLoad }: { autoLoad?: boolean } = { autoLoad: false }) {
    this.words = '';
    this.wordsIndex = {};

    this.isLoaded = false;

    if (autoLoad) this.loadData();
  }

  async loadData() {
    try {
      if (this.isLoaded) return;

      this.words = await api.getLocalDictWords();
      this.wordsIndex = await api.getLocalDictWordsIndex();

      this.isLoaded = true;
    } catch (error) {
      console.error(error);
    }
  }

  searchWord({ input, maxResult }: DictSearchOptions) {
    const inputArr = Array.isArray(input) ? input : [input];

    const result: DictWordLocalEntry[] = [];
    inputArr.forEach((str) => {
      const wordOffsets = this.wordsIndex[str];
      if (!wordOffsets) return;

      for (const offset of wordOffsets) {
        if (result.length > maxResult) break;

        const entryStr = this.words.substring(
          offset,
          this.words.indexOf('\n', offset),
        );
        const entry = parseJSON<DictWordLocalEntry>(entryStr);
        if (!entry) continue;

        result.push(entry);
      }
    });

    return Promise.resolve(result);
  }
}

export default LocalDictionary;
