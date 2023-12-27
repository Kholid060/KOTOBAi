import { createStorage, StorageType } from '@src/shared/storages/base';

type LastUpdateDate = null | string;

const updateDictDateStorage = createStorage<LastUpdateDate>(
  'check-update-at',
  null,
  {
    storageType: StorageType.Local,
  },
);

export default updateDictDateStorage;
