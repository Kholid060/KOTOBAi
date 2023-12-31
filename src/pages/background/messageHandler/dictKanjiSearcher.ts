import { DictKanjiVGEntry } from '@root/src/interface/dict.interface';
import dictDB, {
  DictSearchKanjiOptions,
  DictSearchKanjiVgOptions,
} from '@root/src/shared/db/dict.db';

export async function dictKanjiSearcher(detail: DictSearchKanjiOptions) {
  const result = await dictDB.searchKanji(detail);
  const filteredResult = result.filter(Boolean);

  return filteredResult;
}

export async function dictKanjiVgSearcher(detail: DictSearchKanjiVgOptions) {
  const result = await dictDB.searchKanjiVG(detail);
  const filteredResult = result.filter(Boolean) as DictKanjiVGEntry[];

  return filteredResult;
}
