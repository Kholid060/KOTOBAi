import {
  BaseStorage,
  createStorage,
  StorageType,
} from '@src/shared/storages/base';
import { PartialDeep } from 'type-fest';
import { merge } from 'lodash-es';
import { EXT_SCAN_KEY_MOD } from '../constant/ext-settings.const';

export interface ExtensionSettingsPopup {
  showPOS: boolean;
  showDefinition: boolean;
  fontSize: 'small' | 'normal' | 'large';
}

export interface ExtensionSettingsScanning {
  highlightText: boolean;
  highlightTextBox: boolean;
  modifier: keyof typeof EXT_SCAN_KEY_MOD;
}

export interface ExtensionSettings {
  popup: ExtensionSettingsPopup;
  scanning: ExtensionSettingsScanning;
}

type ExtSettingsStorage = BaseStorage<ExtensionSettings> & {
  update: (settings: PartialDeep<ExtensionSettings>) => void;
};

const storage = createStorage<ExtensionSettings>(
  'ext-settings',
  {
    scanning: {
      modifier: 'none',
      highlightText: true,
      highlightTextBox: true,
    },
    popup: {
      showPOS: true,
      fontSize: 'normal',
      showDefinition: true,
    },
  },
  {
    storageType: StorageType.Local,
  },
);

const extSettingsStorage: ExtSettingsStorage = {
  ...storage,
  update(newSettings) {
    return storage.set((settings) => merge(settings, newSettings));
  },
};

export default extSettingsStorage;
