import { DictLoadState } from '@root/src/interface/dict.interface';
import {
  BaseStorage,
  createStorage,
  StorageType,
} from '@src/shared/storages/base';

interface DictStateStorageVal {
  state: DictLoadState;
  loadState: Record<string, number>;
}

type DictStateStorage = BaseStorage<DictStateStorageVal> & {
  update: (state: Partial<DictStateStorageVal>) => Promise<void>;
};

const storage = createStorage<DictStateStorageVal>(
  'dictState',
  { state: 'not_loaded', loadState: {} },
  {
    storageType: StorageType.Local,
  },
);

const dictStateStorage: DictStateStorage = {
  ...storage,
  update: (state) => storage.set((currVal) => ({ ...currVal, ...state })),
};

export default dictStateStorage;
