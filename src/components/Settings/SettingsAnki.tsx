/* eslint-disable react-hooks/exhaustive-deps */
import { SettingsPageSectionProps } from '@root/src/pages/dashboard/routes/Settings';
import UiCard from '../ui/card';
import { useEffectOnce } from 'usehooks-ts';
import AnkiApi, {
  ANKI_CONNECT_DEFAULT_BASE_URL,
  AnkiAddNoteParam,
} from '@root/src/utils/anki-api';
import { useCallback, useState } from 'react';
import UiSwitch from '../ui/switch';
import { useToast } from '../ui/use-toast';
import UiInput from '../ui/input';
import { debounce, isValidURL } from '@root/src/utils/helper';
import bookmarkDB, {
  formatBookmarkToAnkiNote,
} from '@root/src/shared/db/bookmark.db';

function SettingsAnki({
  settings,
  updateSettings,
  ...props
}: SettingsPageSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  const { toast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [requireApiKey, setRequireApiKey] = useState(false);
  const [pluginInstalled, setPluginInstalled] = useState(false);

  const updateApiURL = useCallback(
    debounce((value: string) => {
      const urlValid = isValidURL(value);
      if (!urlValid) {
        toast({ variant: 'destructive', title: 'Invalid URL' });
        return;
      }

      if (!pluginInstalled) {
        AnkiApi.instance.isInstalled().then(setPluginInstalled);
      }

      updateSettings?.({ anki: { apiURL: value } });
    }, 500),
    [],
  );
  const updateApiKey = useCallback(
    debounce((value: string) => {
      updateSettings?.({ anki: { apiKey: value } });
    }, 200),
    [],
  );

  async function syncBookmarks() {
    try {
      let isInstalled = pluginInstalled;

      if (!isInstalled) {
        isInstalled = await AnkiApi.instance.isInstalled();
        if (!isInstalled) return;

        setPluginInstalled(true);
      }

      setIsSyncing(true);

      const bookmarks = await bookmarkDB.items.toArray();
      const formattedBookmarks = bookmarks.reduce<
        (AnkiAddNoteParam & { id: number })[]
      >((acc, curr) => {
        if (!curr.ankiId) {
          acc.push({
            ...formatBookmarkToAnkiNote(curr),
            id: curr.id as number,
          });
        }

        return acc;
      }, []);

      const { result } = await AnkiApi.instance.addNotes(formattedBookmarks);
      if (!result) return;

      await bookmarkDB.transaction('readwrite', bookmarkDB.items, async () => {
        await Promise.all(
          result.map((ankiId, index) => {
            const bookmark = formattedBookmarks[index];
            if (!ankiId || !bookmark) return Promise.resolve(-1);

            return bookmarkDB.items.update(bookmark.id, { ankiId });
          }),
        );
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  }

  useEffectOnce(() => {
    AnkiApi.instance.isInstalled().then(setPluginInstalled);
    AnkiApi.instance.requestPermission().then(({ result }) => {
      if (!result) return;

      setRequireApiKey(result.requireApiKey);
    });
  });

  return (
    <UiCard {...props}>
      <UiCard.Header>
        <p className="text-lg font-semibold leading-tight">Anki Integration</p>
        <p className="text-sm text-muted-foreground">
          Sync your bookmark into the Anki app. Make sure you have installed the{' '}
          <a
            href="https://ankiweb.net/shared/info/2055492159"
            rel="noreferrer noopener"
            className="link"
            target="_blank"
          >
            AnkiConnect
          </a>{' '}
          plugin in your{' '}
          <a
            href="https://apps.ankiweb.net/"
            rel="noreferrer noopener"
            className="link"
            target="_blank"
          >
            Anki
          </a>{' '}
          app.
        </p>
      </UiCard.Header>
      <UiCard.Content className="space-y-4 divide-y divide-border/50">
        <div className="flex items-center">
          <div className="flex-grow">
            <p>Enable integration</p>
            <p className="text-sm text-muted-foreground">
              Status:{' '}
              {settings.anki.enabled ? (
                pluginInstalled ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Connected
                  </span>
                ) : (
                  <span className="dark:text-orange-400 text-orange-500">
                    AnkiConnect Plugin not installed or the Anki app is not
                    opened
                  </span>
                )
              ) : (
                'Disabled'
              )}
            </p>
          </div>
          <UiSwitch
            checked={settings.anki.enabled}
            disabled={isSyncing}
            onCheckedChange={(value) => {
              updateSettings?.({ anki: { enabled: value } });
              if (value) syncBookmarks();
            }}
          />
        </div>
        <div className="flex items-center pt-4">
          <p className="flex-grow">AnkiConnect server address</p>
          <UiInput
            className="w-56"
            onValueChange={updateApiURL}
            placeholder="http://0.0.0.0:1234"
            defaultValue={settings.anki.apiURL || ANKI_CONNECT_DEFAULT_BASE_URL}
          />
        </div>
        {requireApiKey && (
          <div className="flex items-center pt-4">
            <p className="flex-grow">AnkiConnect API key</p>
            <UiInput
              className="w-56"
              placeholder="API key"
              onValueChange={updateApiKey}
              defaultValue={settings.anki.apiURL}
            />
          </div>
        )}
      </UiCard.Content>
    </UiCard>
  );
}

export default SettingsAnki;
