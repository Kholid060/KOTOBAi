import {
  BaseStorage,
  createStorage,
  StorageType,
} from '@src/shared/storages/base';

export type ThemeList = 'light' | 'dark' | 'system';

type ThemeStorage = BaseStorage<ThemeList> & {
  toggle: () => void;
};

const storage = createStorage<ThemeList>('app-theme', 'system', {
  storageType: StorageType.Local,
});

const themeStorage: ThemeStorage = {
  ...storage,
  toggle: () => {
    storage.set((currentTheme) => {
      return currentTheme === 'light' ? 'dark' : 'light';
    });
  },
};

export default themeStorage;
