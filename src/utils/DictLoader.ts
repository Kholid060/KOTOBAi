import { DICTIONARY_NAME } from '../shared/constant/constant';
import dictDB from '../shared/db/dict.db';
import dictStateStorage from '../shared/storages/dictStateStorage';
import { api } from './api';

const DB_NAME_MAP = {
  [DICTIONARY_NAME.JMDICT]: 'words',
  [DICTIONARY_NAME.ENAMDICT]: 'names',
};

class DictLoader {
  static async loadAllDictionaries() {
    await Promise.all(
      Object.values(DICTIONARY_NAME).map((name) => this.loadDictionary(name)),
    );
  }

  static async loadDictionary(name: `${DICTIONARY_NAME}`) {
    console.log('LOADING DICT DATA: ', name);

    if (name === DICTIONARY_NAME.KANJIDIC) {
      const result = await api.getKanjidicData();
      await dictDB.kanji.bulkPut(result.records);
    } else {
      const savedFileIndex = +(await dictStateStorage.get()).loadState[name];

      let allFetched = false;
      let fileIndex = Number.isNaN(savedFileIndex) ? 1 : savedFileIndex;

      while (!allFetched) {
        await dictStateStorage.set((val) => {
          val.loadState[name] = fileIndex;
          return val;
        });

        const result = await api.getDictPartData(
          <DICTIONARY_NAME.JMDICT>name,
          fileIndex,
        );
        while (result.records.length > 0) {
          const currRecords = result.records.splice(0, 10_000);
          await dictDB[DB_NAME_MAP[name]].bulkPut(currRecords);
        }

        if (result.isLastFile) allFetched = true;
        else fileIndex += 1;

        await dictStateStorage.set((val) => {
          val.loadState[name] = 1;
          return val;
        });
      }
    }

    const metadata = await api.getDictMetadata(name);
    await dictDB.metadata.put({
      metadata,
      id: name,
    });
  }
}

export default DictLoader;
