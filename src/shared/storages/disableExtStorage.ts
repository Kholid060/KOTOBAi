import {
  BaseStorage,
  createStorage,
  StorageType,
} from '@src/shared/storages/base';

interface DisableExtOptions {
  disabled: boolean;
  hostList: string[];
}

type DisableExtStorage = BaseStorage<DisableExtOptions> & {
  addHost: (host: string) => Promise<void>;
  removeHost: (host: string) => Promise<void>;
  toggleDisable: (force?: boolean) => Promise<void>;
};

const storage = createStorage<DisableExtOptions>(
  'disable-ext',
  {
    disabled: false,
    hostList: [],
  },
  {
    storageType: StorageType.Local,
  },
);

const disableExtStorage: DisableExtStorage = {
  ...storage,
  toggleDisable: (force) => {
    return storage.set((currState) => {
      currState.disabled =
        typeof force !== 'undefined' ? force : !currState.disabled;
      return currState;
    });
  },
  addHost: (host) => {
    return storage.set((currState) => {
      if (!currState.hostList.includes(host)) {
        currState.hostList.push(host);
      }

      return currState;
    });
  },
  removeHost(host) {
    return storage.set((currState) => {
      const hostIndex = currState.hostList.indexOf(host);
      if (hostIndex !== -1) {
        currState.hostList.splice(hostIndex, 1);
      }

      return currState;
    });
  },
};

export default disableExtStorage;
