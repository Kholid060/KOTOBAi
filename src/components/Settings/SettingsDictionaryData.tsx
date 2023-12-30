import { SettingsPageSectionProps } from '@root/src/pages/dashboard/routes/Settings';
import UiCard from '../ui/card';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import {
  BookA,
  BookUserIcon,
  DownloadIcon,
  InfoIcon,
  Loader2Icon,
} from 'lucide-react';
import dictDB from '@root/src/shared/db/dict.db';
import { useState } from 'react';
import { useEffectOnce } from 'usehooks-ts';
import UiTooltip from '../ui/tooltip';
import UiProgress from '../ui/progress';
import DictLoader from '@root/src/utils/DictLoader';
import updateDictDateStorage from '@root/src/shared/storages/updateDictDateStorage';
import { UiButton } from '../ui/button';
import dayjs from 'dayjs';
import { api } from '@root/src/utils/api';
import { compare } from 'compare-versions';
import { DictMetadataItem } from '@root/src/interface/dict.interface';
import { sleep } from '@root/src/utils/helper';

const dictionaries: {
  name: string;
  link: string;
  id: DICTIONARY_NAME;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    name: 'JMDict',
    id: DICTIONARY_NAME.JMDICT,
    description: 'Japanese vocabularies',
    icon: <BookA className="h-7 w-7 flex-shrink-0" />,
    link: 'https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project',
  },
  {
    name: 'KANJIDIC ',
    icon: (
      <span className="font-semibold font-sans-jp text-2xl leading-7 inline-block">
        字
      </span>
    ),
    id: DICTIONARY_NAME.KANJIDIC,
    link: 'https://www.edrdg.org/wiki/index.php/KANJIDIC_Project',
    description: 'More information on the kanji used in Japanese',
  },
  {
    name: 'JMnedict',
    id: DICTIONARY_NAME.ENAMDICT,
    description:
      'Japanese names, company names, names of artistic, product names, etc.',
    icon: <BookUserIcon className="h-7 w-7 flex-shrink-0" />,
    link: 'https://www.edrdg.org/enamdict/enamdict_doc.html',
  },
];

type Metadata = Record<string, { dataFrom: string; version: string }>;

function SettingsDictionaryData({
  settings: _settings,
  ...props
}: SettingsPageSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localMetadata, setLocalMetadata] = useState<Metadata>({});
  const [lastCheckUpdate, setLastCheckUpdate] = useState<string | null>('');
  const [loadingState, setLoadingState] = useState<Record<string, number>>({});

  async function checkLocalMetadata() {
    const items = await dictDB.metadata.toArray();
    const tempMetadata: Metadata = {};
    items.forEach((item) => {
      tempMetadata[item.id] = {
        version: item.metadata.version,
        dataFrom: item.metadata.dataCreatedAt,
      };
    });
    setLocalMetadata(tempMetadata);
  }
  async function downloadDictionary(id: DICTIONARY_NAME) {
    try {
      await DictLoader.loadDictionary(id, ({ progress }) => {
        setLoadingState((prevState) => ({
          ...prevState,
          [id]: progress || 0,
        }));
      });
      await DictLoader.putMetadata([id]);
      await checkLocalMetadata();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingState({});
    }
  }
  async function checkUpdates() {
    let dictIds: DICTIONARY_NAME[] = [];

    try {
      setIsUpdating(true);

      const dictMeta = await api.getDictMetadata();

      const checkDate = new Date().toString();
      await updateDictDateStorage.set(checkDate);
      setLastCheckUpdate(checkDate);

      dictIds = (Object.keys(localMetadata) as DICTIONARY_NAME[]).filter((id) =>
        compare(dictMeta[id].version, localMetadata[id].version, '>'),
      );
      if (dictIds.length <= 0) return;

      await Promise.allSettled(
        dictIds.map((id) =>
          DictLoader.loadDictionary(id, ({ progress }) => {
            setLoadingState((prevState) => ({
              ...prevState,
              [id]: progress || 0,
            }));
          }),
        ),
      );

      await sleep(100);

      const metadataArr = Object.entries(dictMeta).reduce<DictMetadataItem[]>(
        (acc, [id, meta]) => {
          const dictId = id as DICTIONARY_NAME;
          if (dictIds.includes(dictId)) {
            acc.push({ id: dictId, metadata: meta });
          }

          return acc;
        },
        [],
      );
      await dictDB.metadata.bulkPut(metadataArr);
      await checkLocalMetadata();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingState({});
      setIsUpdating(false);
    }
  }

  useEffectOnce(() => {
    checkLocalMetadata();
    updateDictDateStorage.get().then(setLastCheckUpdate);

    return () => {
      setLocalMetadata({});
    };
  });

  const isDownloading = Object.keys(loadingState).length > 0;

  return (
    <UiCard {...props}>
      <UiCard.Header className="text-lg font-semibold">
        Dictionary Data
      </UiCard.Header>
      <UiCard.Content>
        <div className="grid grid-cols-3 gap-4">
          {dictionaries.map((dict) => (
            <div
              className="border rounded-lg p-4 flex flex-col group"
              key={dict.id}
            >
              <div className="flex items-center">
                {dict.icon}
                <div className="flex-grow"></div>
                {loadingState[dict.id] ? (
                  <Loader2Icon className="animate-spin text-primary" />
                ) : localMetadata[dict.id] ? (
                  <p>v{localMetadata[dict.id].version}</p>
                ) : (
                  !isDownloading && (
                    <UiTooltip label="Download dictionary">
                      <button onClick={() => downloadDictionary(dict.id)}>
                        <DownloadIcon className="h-5 w-5" />
                      </button>
                    </UiTooltip>
                  )
                )}
              </div>
              <p className="mt-2 font-medium">
                {dict.name}
                <span
                  title={dict.description}
                  className="ml-1 invisible group-hover:visible"
                >
                  <InfoIcon className="h-4 w-4 inline" />
                </span>
              </p>
              <div className="text-muted-foreground leading-tight text-sm">
                {loadingState[dict.id] ? (
                  <UiProgress className="h-2" value={loadingState[dict.id]} />
                ) : localMetadata[dict.id] ? (
                  <p>Data from {localMetadata[dict.id]?.dataFrom}</p>
                ) : (
                  <p>Not downloded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </UiCard.Content>
      <UiCard.Footer>
        <p className="text-muted-foreground text-sm">
          Last check update:{' '}
          {lastCheckUpdate
            ? dayjs(lastCheckUpdate).format('DD MMM YYYY, HH:mm')
            : '-'}
        </p>
        <div className="flex-grow"></div>
        <UiButton
          onClick={checkUpdates}
          className="relative overflow-hidden"
          disabled={isUpdating || isDownloading}
        >
          {isUpdating && (
            <span className="absolute top-0 left-0 w-full h-full z-10 bg-black/30 flex items-center justify-center">
              <Loader2Icon className="animate-spin" />
            </span>
          )}
          Check updates
        </UiButton>
      </UiCard.Footer>
    </UiCard>
  );
}

export default SettingsDictionaryData;
