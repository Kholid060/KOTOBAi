import { DictWordLocalEntry } from '../interface/dict.interface';
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

  searchWord({ input, maxResult }: { input: string; maxResult: number }) {
    const wordOffsets = this.wordsIndex[input];
    if (!wordOffsets) return [];

    const result: DictWordLocalEntry[] = [];

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

    return Promise.resolve(result);
  }
}

export default LocalDictionary;
