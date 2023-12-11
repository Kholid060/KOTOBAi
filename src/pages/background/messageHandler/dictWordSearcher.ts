import { toHiragana } from 'wanakana';
import {
  DictWordEntry,
  DictWordLocalEntry,
  DictWordPriority,
  DictSearchOptions,
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
import { WORD_PRIORITY_WEIGHT } from '@root/src/shared/constant/word.const';

export type DictionaryWordEntryResult = {
  word: string;
  oriWord: string;
  reasons?: Reason[];
} & DictWordEntry &
  DictWordLocalEntry;

export interface SearchDictWordResult {
  input: string;
  maxLength: number;
  entries: DictionaryWordEntryResult[];
}

interface SearchWordOptions {
  input: string;
  maxResult?: number;
  maxQueryLimit?: number;
  controller: AbortController;
  searchWord: (
    detail: DictSearchOptions,
  ) => Promise<(DictWordEntry | DictWordLocalEntry)[]>;
}

const MAX_RESULT_DEF = 7;
const QUERY_LIMIT_DEF = 3;

const YOON = {
  smallY: ['ゃ', 'ゅ', 'ょ'],
  chars: ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'],
};

const endsInYoon = (str: string) =>
  str.length > 1 &&
  YOON.smallY.includes(str.at(-1)) &&
  YOON.chars.includes(str.at(-2));

async function handleSearchForward({
  searchWord,
  maxQueryLimit,
  input: oriInput,
}: SearchWordOptions) {
  const input = toHiragana(oriInput, { passRomaji: true });

  const searchResult: SearchDictWordResult = {
    entries: [],
    maxLength: 0,
    input: oriInput,
  };

  const candidcateInputted = new Set<number>();

  const candidates = deinflect(input);
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];

    const searchInput = [candidate.word];
    if (index === 0 && oriInput !== input) searchInput.push(oriInput);

    const entries = await searchWord({
      matchWhole: false,
      input: searchInput,
      maxResult: maxQueryLimit,
    });

    for (const entry of entries) {
      if (candidcateInputted.has(entry.id)) continue;

      searchResult.entries.push({
        ...entry,
        oriWord: input,
        word: candidate.word,
        reasons: candidate.reasons.flat(),
      });

      candidcateInputted.add(entry.id);
    }
  }

  return searchResult;
}

async function handleSearchWhole({
  searchWord,
  maxQueryLimit,
  input: oriInput,
}: SearchWordOptions) {
  const searchResult: SearchDictWordResult = {
    entries: [],
    maxLength: 0,
    input: oriInput,
  };
  const input = toHiragana(oriInput, { passRomaji: true });

  const searchInput = [input];
  if (input !== oriInput) searchInput.push(oriInput);

  const entries = await searchWord({
    matchWhole: true,
    input: searchInput,
    maxResult: maxQueryLimit,
  });
  searchResult.entries = entries.map((entry) => ({
    ...entry,
    reason: [],
    word: input,
    oriWord: oriInput,
  }));

  return searchResult;
}

async function handleSearchBackward({
  controller,
  searchWord,
  maxQueryLimit,
  input: oriInput,
  maxResult = MAX_RESULT_DEF,
}: SearchWordOptions) {
  const searchResult: SearchDictWordResult = {
    entries: [],
    maxLength: 0,
    input: oriInput,
  };
  const input = toHiragana(oriInput, { passRomaji: true });

  const checkSignal = () => {
    if (controller.signal.aborted) throw new Error('Aborted');
  };

  const inputtedWordEntry = new Set<number>();
  const candidateSearched = new Set<string>();

  let copyInput = `${input}`;

  while (copyInput.length) {
    checkSignal();

    const oriWord = oriInput.slice(0, copyInput.length);

    const candidates = deinflect(copyInput);
    for (let index = 0; index < candidates.length; index += 1) {
      checkSignal();

      if (searchResult.entries.length >= maxResult) return searchResult;

      const candidate = candidates[index];
      if (candidateSearched.has(candidate.word)) continue;

      const searchInput = [candidate.word];
      if (oriWord !== copyInput) searchInput.push(oriWord);

      let entries = await searchWord({
        input: searchInput,
        maxResult: maxQueryLimit,
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
          oriWord,
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

    const sliceLen = endsInYoon(copyInput) ? 2 : 1;
    copyInput = copyInput.slice(0, -sliceLen);
  }

  return searchResult;
}

function sortSearchResult(result: SearchDictWordResult): SearchDictWordResult {
  const getScore = (items: DictWordPriority[]) => {
    let sum = 0;

    items.forEach((str) => {
      if (str.startsWith('nf')) {
        const freq = +str.slice(2);
        sum += Math.floor(65 * Math.exp(-0.1 * freq));

        return;
      }

      sum += WORD_PRIORITY_WEIGHT[str] || 0;
    });

    return sum;
  };
  const getPriority = (entry: DictionaryWordEntryResult) => {
    if (!entry.kPrio && !entry.rPrio) return 0;

    let score = 0;
    entry.reading?.forEach((reading, index) => {
      if (reading !== entry.word || !entry.rPrio || !entry.rPrio[index]) return;

      score = Math.max(score, getScore(entry.rPrio[index]));
    });
    entry.kanji?.forEach((kanji, index) => {
      if (kanji !== entry.word || !entry.kPrio || !entry.kPrio[index]) return;

      score = Math.max(score, getScore(entry.kPrio[index]));
    });

    return score;
  };

  const sortedEntries = [...result.entries].sort((a, b) => {
    if (a.word !== b.word) return 0;

    return getPriority(b) - getPriority(a);
  });

  return {
    ...result,
    entries: sortedEntries,
  };
}

export default function dictWordSearcher(isIframe = false) {
  let searchController: AbortController | null = null;

  const resultCache = new MemoryCache<string, SearchDictWordResult>();

  return async (
    {
      input,
      maxResult,
      frameSource,
      type = 'search-backward',
      maxQueryLimit = QUERY_LIMIT_DEF,
    }: MessageSearchWordOpts,
    sender: Browser.Runtime.MessageSender,
  ) => {
    if (searchController) {
      searchController.abort();
      searchController = null;
    }

    try {
      console.log('SEARCH', input);
      searchController = new AbortController();

      const cacheResult = resultCache.get(input);
      if (cacheResult) return cacheResult.value;

      let dictionary: Dictionary | LocalDictionary =
        await getBackgroundDictionary();
      let searchWord = dictionary.searchWord;
      if (dictionary.loadState !== 'loaded') {
        dictionary = await getBackgroundDictionary(true);
        searchWord = dictionary.searchWord.bind(dictionary);
      }

      const searchPayload = {
        input,
        maxResult,
        searchWord,
        maxQueryLimit,
        controller: searchController,
      };

      let result: SearchDictWordResult;
      switch (type) {
        case 'search-backward':
          result = await handleSearchBackward(searchPayload);
          break;
        case 'search-forward':
          result = await handleSearchForward(searchPayload);
          break;
        case 'whole':
          result = await handleSearchWhole(searchPayload);
          break;
      }

      result = sortSearchResult(result);

      resultCache.add(input, result);

      if (isIframe) {
        await RuntimeMessage.sendMessageToTab(
          {
            frameId: 0,
            tabId: sender.tab.id!,
            name: 'content:iframe-word-result',
          },
          {
            ...result,
            frameSource,
          },
        );

        result.entries = [];
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
