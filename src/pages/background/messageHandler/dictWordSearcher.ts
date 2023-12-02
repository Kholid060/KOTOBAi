import { isKanji, toHiragana } from 'wanakana';
import {
  DictWordEntry,
  DictWordLocalEntry,
} from '@root/src/interface/dict.interface';
import { getBackgroundDictionary } from '../BackgroundDict';
import { MessageSearchWordOpts } from '@root/src/utils/RuntimeMessage';
import MemoryCache from '@root/src/utils/MemoryCache';
import Dictionary from '@root/src/utils/Dictionary';
import LocalDictionary from '@root/src/utils/LocalDictionary';

export interface SearchDictWordResult {
  input: string;
  maxLength: number;
  kanji: { char: string; pos: number }[];
  entries: (DictWordEntry | DictWordLocalEntry)[];
}

const DEFAULT_MAX_RESULT = 5;
const YOON = {
  smallY: ['ゃ', 'ゅ', 'ょ'],
  chars: ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'],
};

const endsInYoon = (str: string) =>
  str.length > 1 &&
  YOON.smallY.includes(str.at(-1)) &&
  YOON.chars.includes(str.at(-2));

async function handleSearchWord({
  input,
  controller,
  searchWord,
  maxResult = DEFAULT_MAX_RESULT,
}: {
  input: string;
  maxResult?: number;
  controller: AbortController;
  searchWord: (
    input: string,
  ) => Promise<(DictWordEntry | DictWordLocalEntry)[]>;
}) {
  const searchResult: SearchDictWordResult = {
    input,
    kanji: [],
    entries: [],
    maxLength: 0,
  };

  let copyInput = `${input}`;

  while (copyInput.length) {
    if (controller.signal.aborted) throw new Error('Aborted');
    if (searchResult.entries.length > maxResult) return searchResult;

    const entries = await searchWord(copyInput);
    searchResult.entries.push(...entries);

    if (entries.length > 0) {
      console.log(copyInput.length);
      searchResult.maxLength = Math.max(
        searchResult.maxLength,
        copyInput.length,
      );
    }

    const lastChar = copyInput.at(-1);
    if (lastChar && isKanji(lastChar)) {
      searchResult.kanji.unshift({
        char: lastChar,
        pos: copyInput.length - input.length + input.length - 1,
      });
    }

    const sliceLen = endsInYoon(copyInput) ? 2 : 1;
    copyInput = copyInput.slice(0, -sliceLen);
  }

  return searchResult;
}

export default function dictWordSearcher() {
  let searchController: AbortController | null = null;

  const resultCache = new MemoryCache<string, SearchDictWordResult>();

  return async ({ input, maxResult }: MessageSearchWordOpts) => {
    if (searchController) {
      searchController.abort();
      searchController = null;
    }

    try {
      console.log('SEARCH', input);
      searchController = new AbortController();

      const wordToSearch = toHiragana(input, { passRomaji: true });
      const cacheResult = resultCache.get(wordToSearch);
      if (cacheResult) return cacheResult.value;

      let dictionary: Dictionary | LocalDictionary =
        await getBackgroundDictionary();
      let searchWord = dictionary.searchWord;
      if (dictionary.loadState !== 'loaded') {
        dictionary = await getBackgroundDictionary(true);
        searchWord = dictionary.searchWord.bind(dictionary);
      }

      const result = await handleSearchWord({
        maxResult,
        searchWord,
        input: wordToSearch,
        controller: searchController,
      });

      resultCache.add(wordToSearch, result);

      console.log('RESULT || ', input, ' || ', result);

      return result;
    } catch (error) {
      console.error(error);
    } finally {
      searchController = null;
    }
  };
}
