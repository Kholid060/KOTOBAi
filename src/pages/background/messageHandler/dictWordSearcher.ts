import { isKanji, toHiragana } from 'wanakana';
import {
  DictWordEntry,
  DictWordLocalEntry,
} from '@root/src/interface/dict.interface';
import { getBackgroundDictionary } from '../BackgroundDict';
import RuntimeMessage, {
  MessageSearchWordOpts,
} from '@root/src/utils/RuntimeMessage';
import MemoryCache from '@root/src/utils/MemoryCache';
import Dictionary from '@root/src/utils/Dictionary';
import LocalDictionary from '@root/src/utils/LocalDictionary';
import Browser from 'webextension-polyfill';
import { Reason, deinflect, entryMatchesType } from '@src/shared/lib/deinflect';

export type DictionaryEntryResult = {
  word: string;
  reasons?: Reason[];
} & DictWordEntry &
  DictWordLocalEntry;

export interface SearchDictWordResult {
  input: string;
  maxLength: number;
  kanji: { char: string; pos: number }[];
  entries: DictionaryEntryResult[];
}

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
  maxResult = 7,
  wordQueryLimit = 3,
}: {
  input: string;
  maxResult?: number;
  wordQueryLimit?: number;
  controller: AbortController;
  searchWord: (input: {
    input: string;
    maxResult: number;
  }) => Promise<(DictWordEntry | DictWordLocalEntry)[]>;
}) {
  const searchResult: SearchDictWordResult = {
    input,
    kanji: [],
    entries: [],
    maxLength: 0,
  };

  const checkSignal = () => {
    if (controller.signal.aborted) throw new Error('Aborted');
  };

  const inputtedWordEntry = new Set<number>();
  const candidateSearched = new Set<string>();

  let copyInput = `${input}`;

  while (copyInput.length) {
    checkSignal();

    const candidates = deinflect(copyInput);
    for (let index = 0; index < candidates.length; index += 1) {
      checkSignal();

      if (searchResult.entries.length >= maxResult) return searchResult;

      const candidate = candidates[index];
      if (candidateSearched.has(candidate.word)) continue;

      let entries = await searchWord({
        input: candidate.word,
        maxResult: wordQueryLimit,
      });
      entries = entries.filter((entry) => {
        if (index === 0 || !entry.sense) return true;

        return entryMatchesType(entry.sense ?? [], candidate.type);
      });
      if (entries.length <= 0) continue;

      for (const entry of entries) {
        checkSignal();

        if (inputtedWordEntry.has(entry.id)) continue;

        searchResult.entries.push({
          ...entry,
          word: candidate.word,
          reasons: candidate.reasons.flat(),
        });

        inputtedWordEntry.add(entry.id);
      }

      candidateSearched.add(candidate.word);

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

export default function dictWordSearcher(isIframe = false) {
  let searchController: AbortController | null = null;

  const resultCache = new MemoryCache<string, SearchDictWordResult>();

  return async (
    { input, maxResult, frameSource }: MessageSearchWordOpts,
    sender: Browser.Runtime.MessageSender,
  ) => {
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

      if (isIframe) {
        await RuntimeMessage.sendMessageToTab(
          {
            frameId: 0,
            tabId: sender.tab.id!,
            name: 'content:iframe-word-result',
          },
          {
            input,
            kanji: [],
            entries: [],
            frameSource,
            maxLength: result.maxLength,
          },
        );
      }
      console.log('RESULT || ', input, ' || ', result);

      return result;
    } catch (error) {
      console.error(error);
    } finally {
      searchController = null;
    }
  };
}
