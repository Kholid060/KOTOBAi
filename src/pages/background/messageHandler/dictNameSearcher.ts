import { MessageSearchNameOpts } from '@root/src/utils/RuntimeMessage';
import MemoryCache from '@root/src/utils/MemoryCache';
import { DictNameEntry } from '@root/src/interface/dict.interface';
import { toHiragana } from 'wanakana';
import dictDB from '@root/src/shared/db/dict.db';
export interface DictionaryNameEntryResult extends DictNameEntry {
  word: string;
  oriWord?: string;
}

function mapNameEntries(
  entries: DictNameEntry[],
  word: string,
  oriWord: string,
): DictionaryNameEntryResult[] {
  return entries.map((entry) => ({ ...entry, word, oriWord }));
}

export function dictNameSearcher() {
  const resultCache = new MemoryCache<string, DictionaryNameEntryResult[]>();

  return async ({
    type,
    maxResult = 5,
    input: oriInput,
    maxQueryLimit = 3,
  }: MessageSearchNameOpts) => {
    const cacheResult = resultCache.get(oriInput);
    if (cacheResult) return cacheResult.value;

    const input = toHiragana(oriInput, { passRomaji: true });

    if (type === 'whole' || type === 'search-forward') {
      const searchInput = [input];
      if (input !== oriInput) searchInput.push(oriInput);

      const result = await dictDB.searchNames({
        maxResult,
        input: searchInput,
        matchWhole: type !== 'search-forward',
      });
      const mappedResult = mapNameEntries(result, input, oriInput);

      resultCache.add(input, mappedResult);

      return mappedResult;
    }

    const result: DictionaryNameEntryResult[] = [];
    let copyInput = `${input}`;

    while (copyInput.length) {
      if (result.length > maxResult) break;

      const names = await dictDB.searchNames({
        input: copyInput,
        maxResult: maxQueryLimit,
      });
      const mappedNames = mapNameEntries(
        names,
        copyInput,
        oriInput.slice(0, copyInput.length),
      );
      result.concat(mappedNames);

      copyInput = copyInput.slice(0, -1);
    }

    resultCache.add(input, result);

    return result;
  };
}
