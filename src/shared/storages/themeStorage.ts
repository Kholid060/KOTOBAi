import {
  BaseStorage,
  createStorage,
  StorageType,
} from '@src/shared/storages/base';

export type ThemeList = 'light' | 'dark';

type ThemeStorage = BaseStorage<ThemeList> & {
  toggle: () => void;
};

const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

const storage = createStorage<ThemeList>(
  'app-theme',
  isDarkTheme ? 'dark' : 'light',
  {
    storageType: StorageType.Local,
  },
);

const themeStorage: ThemeStorage = {
  ...storage,
  toggle: () => {
    storage.set((currentTheme) => {
      return currentTheme === 'light' ? 'dark' : 'light';
    });
  },
};

export default themeStorage;
