import dictDB, {
  DictSearchKanjiOptions,
  DictSearchKanjiVgOptions,
} from '@root/src/shared/db/dict.db';

export async function dictKanjiSearcher(detail: DictSearchKanjiOptions) {
  const result = await dictDB.searchKanji(detail);
  return result;
}

export async function dictKanjiVgSearcher(detail: DictSearchKanjiVgOptions) {
  const result = await dictDB.searchKanjiVG(detail);
  return result;
}
