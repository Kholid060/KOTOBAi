import JSZip from 'jszip';
import { DICTIONARY_NAME } from '../shared/constant/constant';
import dictDB from '../shared/db/dict.db';
import { api } from './api';
import {
  DictEntry,
  DictFileEntries,
  DictMetadata,
} from '../interface/dict.interface';
import { getRandomArbitrary } from './helper';

const DB_NAME_MAP = {
  [DICTIONARY_NAME.JMDICT]: 'words',
  [DICTIONARY_NAME.KANJIDIC]: 'kanji',
  [DICTIONARY_NAME.ENAMDICT]: 'names',
  [DICTIONARY_NAME.KANJIVG]: 'kanjivg',
};
class DictLoader {
  static async loadAllDictionaries() {
    await Promise.all(
      Object.values(DICTIONARY_NAME).map((name) => this.loadDictionary(name)),
    );
  }

  static async loadDictionary(
    name: `${DICTIONARY_NAME}`,
    onProgress?: (event: {
      progress: number;
      type: 'downloading' | 'parsing';
    }) => void,
  ) {
    console.log('LOADING DICT DATA: ', name);

    const maxDownloadProgress = getRandomArbitrary(5, 75);
    const zipBuffer = await api.downloadDictionaryZip(name, {
      onDownloadProgress({ progress }) {
        onProgress?.({
          type: 'downloading',
          progress: (progress || 0) * maxDownloadProgress,
        });
      },
    });

    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.values(zip.files);

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const fileStr = await file.async('string');
      const kanjiData = JSON.parse(fileStr) as DictFileEntries<DictEntry>;

      while (kanjiData.records.length > 0) {
        const currRecords = kanjiData.records.splice(0, 10_000);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await dictDB[DB_NAME_MAP[name]].bulkPut(currRecords);
      }

      const currProgress =
        ((index + 1) / files.length) * (100 - maxDownloadProgress);
      onProgress?.({
        type: 'parsing',
        progress: maxDownloadProgress + currProgress,
      });
    }
  }

  static async putMetadata(dicts: (DICTIONARY_NAME | `${DICTIONARY_NAME}`)[]) {
    const metadata = await api.getDictMetadata();
    const metadataArr = Object.entries(metadata).reduce<
      { id: DICTIONARY_NAME; metadata: DictMetadata }[]
    >((acc, [id, metadata]) => {
      const dictId = id as DICTIONARY_NAME;
      if (dicts.includes(dictId)) {
        acc.push({ id: dictId, metadata });
      }

      return acc;
    }, []);
    await dictDB.metadata.bulkPut(metadataArr);
  }
}

export default DictLoader;
