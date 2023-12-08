import { DictSearchKanjiOptions } from '@root/src/utils/Dictionary';
import { getBackgroundDictionary } from '../BackgroundDict';

export async function dictKanjiSearcher(detail: DictSearchKanjiOptions) {
  const dictionary = await getBackgroundDictionary();
  if (dictionary.loadState !== 'loaded') return [];

  const result = await dictionary.searchKanji(detail);
  return result;
}
