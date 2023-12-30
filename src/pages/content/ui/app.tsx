import { createContext, useState } from 'react';
import WordPopover from './WordPopover/WordPopover';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';
import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../content-handler/ContentHandler';
import CommandContainer from './Command/CommandContainer';
import { ThemeProvider } from '@root/src/shared/context/theme.context';
import extSettingsStorage, {
  ExtensionSettings,
} from '@root/src/shared/storages/extSettingsStorage';
import Browser from 'webextension-polyfill';

export const AppContentContext = createContext<{
  isDisabled?: boolean;
  shadowRoot: ShadowRoot | null;
  extSettings: ExtensionSettings;
  setSearch?: (query: string) => void;
}>({
  shadowRoot: null,
  isDisabled: false,
  extSettings: extSettingsStorage.$defaultValue,
});

export default function App({
  disabled,
  shadowRoot,
}: {
  disabled: boolean;
  shadowRoot: ShadowRoot;
}) {
  const [isDisabled, setIsDisabled] = useState(() => disabled);
  const [extSettings, setExtSettings] = useState(
    () => extSettingsStorage.$defaultValue,
  );

  useEffectOnce(() => {
    const onStorageChanged = (
      changes: Browser.Storage.StorageAreaOnChangedChangesType,
    ) => {
      const updatedSettings = changes[extSettingsStorage.$key];
      if (updatedSettings)
        setExtSettings(updatedSettings.newValue as ExtensionSettings);
    };
    Browser.storage.local.onChanged.addListener(onStorageChanged);

    extSettingsStorage.get().then(setExtSettings);

    contentEventEmitter.addListener('disable-state-change', (value) =>
      setIsDisabled(value ?? false),
    );

    return () => {
      contentEventEmitter.removeAllListeners();
      Browser.storage.local.onChanged.removeListener(onStorageChanged);
    };
  });

  if (isDisabled) return null;

  return (
    <UiTooltipProvider>
      <ThemeProvider container={shadowRoot.firstElementChild as HTMLElement}>
        <AppContentContext.Provider
          value={{ shadowRoot, isDisabled, extSettings }}
        >
          <WordPopover />
          <CommandContainer />
        </AppContentContext.Provider>
      </ThemeProvider>
    </UiTooltipProvider>
  );
}
