import { UiButton } from '@root/src/components/ui/button';
import UiCard from '@root/src/components/ui/card';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import DictLoader from '@root/src/utils/DictLoader';
import {
  BookA,
  BookUserIcon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateEffect } from 'usehooks-ts';

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
    icon: <BookA className="h-5 w-5 flex-shrink-0 mt-1" />,
    link: 'https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project',
  },
  {
    name: 'KANJIDIC ',
    icon: (
      <span className="font-semibold font-sans-jp text-lg inline-block">
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
    icon: <BookUserIcon className="h-5 w-5 flex-shrink-0 mt-1" />,
    link: 'https://www.edrdg.org/enamdict/enamdict_doc.html',
  },
];

const defDictProgress = {
  [DICTIONARY_NAME.JMDICT]: 0,
  [DICTIONARY_NAME.KANJIVG]: 0,
  [DICTIONARY_NAME.KANJIDIC]: 0,
  [DICTIONARY_NAME.ENAMDICT]: 0,
};

function WelcomePage() {
  const navigate = useNavigate();

  const [selectedDicts, setSelectedDicts] = useState<`${DICTIONARY_NAME}`[]>([
    DICTIONARY_NAME.JMDICT,
  ]);
  const [dictProgress, setDictProgress] = useState<
    Record<DICTIONARY_NAME, number>
  >(() => ({ ...defDictProgress }));

  const [isDownloading, setIsDownloading] = useState(false);

  function toggleSelected(name: DICTIONARY_NAME) {
    if (isDownloading) return;

    const isSelected = selectedDicts.includes(name);
    if (isSelected) {
      setSelectedDicts((prevState) =>
        prevState.filter((item) => item !== name),
      );
      return;
    }

    setSelectedDicts([...selectedDicts, name]);
  }
  async function startDownload() {
    try {
      setIsDownloading(true);

      const dicts = [...selectedDicts];
      if (dicts.includes(DICTIONARY_NAME.KANJIDIC)) {
        dicts.push(DICTIONARY_NAME.KANJIVG);
      }

      await Promise.allSettled(
        dicts.map((dictName) =>
          DictLoader.loadDictionary(dictName, ({ progress, type }) => {
            console.log(dictName, `(${type}): ${Math.floor(progress)}%`);
            setDictProgress((prevState) => ({
              ...prevState,
              [dictName]: progress,
            }));
          }),
        ),
      );

      await DictLoader.putMetadata(selectedDicts);

      navigate('/', { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
      setDictProgress({ ...defDictProgress });
    }
  }
  function getDownloadProgress(name: DICTIONARY_NAME) {
    let currProgess = dictProgress[name];
    if (name === DICTIONARY_NAME.KANJIVG) {
      currProgess = (currProgess + dictProgress.kanjivg) / 2;
    }

    return currProgess;
  }

  useUpdateEffect(() => {
    window.onbeforeunload = isDownloading
      ? () => {
          return true;
        }
      : null;

    return () => {
      window.onbeforeunload = null;
    };
  }, [isDownloading]);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="absolute top-0 left-0 -z-10 h-4/6 w-8/12 bg-gradient-to-br from-cyan-700/30 via-blue-700/30 dark:from-cyan-500/10 dark:via-blue-500/10 to-50% to-transparent"></div>
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold">Welcome to Kotobai! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Download the dictionary data to start using the app
        </p>
        <UiCard className="mt-6">
          <UiCard.Header>
            <p>Select dictionaries to download</p>
          </UiCard.Header>
          <UiCard.Content>
            <div className="w-full space-y-2">
              {dictionaries.map((dictionary) => (
                <button
                  key={dictionary.id}
                  onClick={() => toggleSelected(dictionary.id)}
                  disabled={isDownloading}
                  className={cn(
                    'w-full hover:bg-secondary/80 relative group rounded-md overflow-hidden',
                    selectedDicts.includes(dictionary.id)
                      ? 'ring-2 bg-secondary/80 highlight-secondary/80'
                      : isDownloading && 'disabled:opacity-50',
                  )}
                  style={
                    isDownloading ? { backgroundColor: 'transparent' } : {}
                  }
                >
                  {isDownloading && Boolean(dictProgress[dictionary.id]) && (
                    <div
                      className="h-full bg-primary/20 w-20 transition-all duration-200 absolute top-0 left-0"
                      style={{
                        width: `${getDownloadProgress(dictionary.id)}%`,
                        transition: 'width 250ms ease',
                      }}
                    ></div>
                  )}
                  <div className="z-10 flex items-start text-left px-4 py-2 gap-2 relative">
                    <span className="w-5 flex-shrink-0">{dictionary.icon}</span>
                    <div className="flex-grow">
                      <p>
                        {dictionary.name}{' '}
                        <a
                          target="_blank"
                          href={dictionary.link}
                          rel="noreferrer noopener"
                          className="invisible group-hover:visible"
                        >
                          <ExternalLinkIcon className="inline-block align-text-top h-4 w-4" />
                        </a>
                      </p>
                      <p className="text-muted-foreground leading-tight">
                        {dictionary.description}
                      </p>
                    </div>
                    {selectedDicts.includes(dictionary.id) && (
                      <CheckIcon className="h-5 w-5 dark:text-emerald-400 text-emerald-700 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </UiCard.Content>
          <UiCard.Footer className="block">
            <UiButton
              size="lg"
              className="w-full"
              onClick={startDownload}
              disabled={selectedDicts.length <= 0 || isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2Icon className="animate-spin h-4 w-4" />
                  <span className="ml-2">Downloading dictionaries</span>
                </>
              ) : (
                'Download Dictionaries'
              )}
            </UiButton>
            <p className="text-sm mt-1 text-muted-foreground">
              Don&apos;t close this tab while downloading the dictionaries
            </p>
          </UiCard.Footer>
        </UiCard>
      </div>
    </div>
  );
}

export default WelcomePage;
