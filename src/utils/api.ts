import Browser from 'webextension-polyfill';
import { $fetch } from './fetch';
import {
  DictKanjiEntry,
  DictMetadata,
  DictNameEntry,
  DictWordEntry,
  KanjiDictMetadata,
} from '../interface/dict.interface';
import { DictEntriesReqResult } from '../interface/api.interface';
import { DICTIONARY_NAME } from '../shared/constant/constant';

const { VITE_DICT_BASE_URL } = import.meta.env;

async function getLocalDictWords() {
  const url = Browser.runtime.getURL('/data/dictionary.data');
  const response = await $fetch(url, {
    retries: 3,
  });
  const dictionary = await response.text();

  return dictionary;
}

async function getLocalDictWordsIndex() {
  const url = Browser.runtime.getURL('/data/dictionary.idx');
  const response = await $fetch(url, {
    retries: 3,
  });
  const dictionaryIdx = await response.json();

  return dictionaryIdx as Record<string, number[]>;
}

async function getDictPartData<
  T extends DICTIONARY_NAME.JMDICT | DICTIONARY_NAME.ENAMDICT,
>(
  name: T,
  fileIndex: number,
): Promise<
  DictEntriesReqResult<
    (T extends DICTIONARY_NAME.JMDICT ? DictWordEntry : DictNameEntry)[]
  >
> {
  const response = await $fetch(
    `${VITE_DICT_BASE_URL}/${name}/${name}-${fileIndex}.json`,
    {
      retries: 3,
    },
  );
  const entries = await response.json();

  return entries;
}

async function getDictMetadata<T extends `${DICTIONARY_NAME}`>(
  name: T,
): Promise<
  T extends DICTIONARY_NAME.KANJIDIC ? KanjiDictMetadata : DictMetadata
> {
  const response = await $fetch(
    `${VITE_DICT_BASE_URL}/${name}/${name}-meta.json`,
  );
  const result = await response.json();

  return result;
}

async function getKanjidicData() {
  const response = await $fetch(
    `${VITE_DICT_BASE_URL}/kanjidic/kanjidic.json`,
    {
      retries: 3,
    },
  );
  const entries: DictEntriesReqResult<DictKanjiEntry[]> = await response.json();

  return entries;
}

export const api = {
  getDictPartData,
  getKanjidicData,
  getDictMetadata,
  getLocalDictWords,
  getLocalDictWordsIndex,
};
