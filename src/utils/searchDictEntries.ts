import { isKanji } from 'wanakana';
import { DictKanjiEntry } from '../interface/dict.interface';
import { DictionaryNameEntryResult } from '../pages/background/messageHandler/dictNameSearcher';
import { DictionaryWordEntryResult } from '../pages/background/messageHandler/dictWordSearcher';
import RuntimeMessage from './RuntimeMessage';

export type DictQueryType = 'words' | 'kanji' | 'names' | 'all';

export interface DictQueryResult {
  kanji: DictKanjiEntry[];
  names: DictionaryNameEntryResult[];
  words: DictionaryWordEntryResult[];
}

export const dictQueryTypeSymbol = {
  '#': 'words',
  '＃': 'words',
  '>': 'kanji',
  '＞': 'kanji',
  '@': 'names',
  '＠': 'names',
};

export const getDictQueryType = (str: string): DictQueryType => {
  const { 0: firstChar } = str.trim();
  if (dictQueryTypeSymbol[firstChar]) return dictQueryTypeSymbol[firstChar];

  return 'all';
};

const queriesMap = {
  words: async (input: string) => {
    const result = await RuntimeMessage.sendMessage('background:search-word', {
      input,
      maxResult: 15,
      maxQueryLimit: 10,
      type: 'search-forward',
    });

    return result.entries;
  },
  kanji: async (input: string) => {
    const kanjiIds = input
      .trim()
      .split('')
      .reduce<Set<number>>((acc, char) => {
        if (isKanji(char)) {
          acc.add(char.codePointAt(0));
        }

        return acc;
      }, new Set());
    const result = await RuntimeMessage.sendMessage('background:search-kanji', {
      by: 'id',
      maxResult: 5,
      input: [...kanjiIds],
    });

    return result.filter(Boolean);
  },
  names: async (input: string) => {
    const result = await RuntimeMessage.sendMessage('background:search-name', {
      input,
      maxResult: 15,
      maxQueryLimit: 10,
      type: 'search-forward',
    });

    return result;
  },
};

export default async function searchDictEntries(query: string) {
  const result: DictQueryResult = {
    kanji: [],
    words: [],
    names: [],
  };

  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const queryType = getDictQueryType(query);
  console.log(query, queryType);
  if (queryType !== 'all' && trimmedQuery.length <= 1) return;

  if (queryType === 'all') {
    const [words, kanji, names] = await Promise.allSettled([
      queriesMap.words(trimmedQuery),
      queriesMap.kanji(trimmedQuery),
      queriesMap.names(trimmedQuery),
    ]);

    result.kanji = kanji.status === 'fulfilled' ? kanji.value : [];
    result.names = names.status === 'fulfilled' ? names.value : [];
    result.words = words.status === 'fulfilled' ? words.value : [];
  } else {
    //@ts-expect-error expected!!!
    result[queryType] = await queriesMap[queryType](trimmedQuery.slice(1));
  }

  return result;
}
