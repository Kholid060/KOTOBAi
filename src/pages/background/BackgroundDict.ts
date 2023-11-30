import Dictionary from '@src/utils/Dictionary';
import LocalDictionary from '@src/utils/LocalDictionary';

const dictionaryInstance = new Dictionary();
let localDictionaryInstance: LocalDictionary;

export async function getBackgroundDictionary(
  local?: false,
): Promise<Dictionary>;
export async function getBackgroundDictionary(
  local?: true,
): Promise<LocalDictionary>;
export async function getBackgroundDictionary(local = false) {
  if (local) {
    if (!localDictionaryInstance) {
      localDictionaryInstance = new LocalDictionary();
      await localDictionaryInstance.loadData();
    }

    return localDictionaryInstance;
  }

  return dictionaryInstance;
}
