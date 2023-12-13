import { $fetch } from './fetch';
import { DICTIONARY_NAME } from '../shared/constant/constant';
// eslint-disable-next-line import/named
import { AxiosRequestConfig } from 'axios';
import $axios from '../shared/lib/axios';
import { DictMetadataRecord } from '../interface/dict.interface';

const { VITE_DICT_BASE_URL } = import.meta.env;

async function getDictMetadata() {
  const response = await $fetch(`${VITE_DICT_BASE_URL}/dict-metadata.json`);
  const result = (await response.json()) as DictMetadataRecord;

  return result;
}

async function downloadDictionaryZip(
  name: `${DICTIONARY_NAME}`,
  config: AxiosRequestConfig = {},
) {
  const response = await $axios.get<ArrayBuffer>(
    `${VITE_DICT_BASE_URL}/zip/${name}.zip`,
    {
      ...config,
      responseType: 'arraybuffer',
      'axios-retry': { retries: 3 },
    },
  );

  return response.data;
}

export const api = {
  getDictMetadata,
  downloadDictionaryZip,
};
