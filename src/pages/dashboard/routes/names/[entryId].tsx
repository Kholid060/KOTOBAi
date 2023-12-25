import { DictNameEntry } from '@root/src/interface/dict.interface';
import dictDB from '@root/src/shared/db/dict.db';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { useRef, useState, useEffect } from 'react';
import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import SharedBookmarkBtnMain from '@root/src/components/shared/SharedBookmarkBtn/Main';
import { UiButton } from '@root/src/components/ui/button';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { Volume2Icon } from 'lucide-react';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import { NAME_TYPES } from '@root/src/shared/constant/word.const';

function NameDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams();
  const [searchParams] = useSearchParams();
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  const { dictEntry } = location.state ?? {};

  const matchWord = useRef('');

  const [nameDetail, setWordDetail] = useState<
    DictNameEntry | DictionaryNameEntryResult | null
  >(null);

  useEffect(() => {
    setWordDetail(dictEntry);
    if (dictEntry) {
      setWordDetail(dictEntry);
    } else {
      dictDB.names.get(+entryId).then((result) => {
        if (!result) {
          navigate('/');
          return;
        }

        setWordDetail(result);
      });
    }

    return () => {
      setWordDetail(null);
    };
  }, [dictEntry, entryId, navigate]);

  if (!nameDetail) return null;

  return (
    <>
      <div className="flex items-center">
        <ViewReadingKanji
          className="text-3xl flex-grow"
          onMatchWord={(match) => (matchWord.current = match)}
          entry={{ word: searchParams.get('word'), ...nameDetail }}
        />
        <SharedBookmarkBtnMain
          entry={{
            id: nameDetail.id,
            kanji: nameDetail.kanji,
            reading: nameDetail.reading,
            type: DICTIONARY_NAME.JMDICT,
            meaning: nameDetail.tr.detail,
          }}
        />
        {isSpeechAvailable && (
          <UiButton
            variant="secondary"
            size="icon-xs"
            onClick={() => speak(matchWord.current || nameDetail.reading[0])}
            className="ml-1 flex-shrink-0"
          >
            <Volume2Icon className="h-4 w-4" />
          </UiButton>
        )}
      </div>
      <ul className="mt-8 list-decimal pl-4 space-y-2">
        {nameDetail.tr.detail.map((detail, idx) => (
          <li key={idx}>
            <span
              title={NAME_TYPES[nameDetail.tr.type[idx]]}
              className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
            >
              {NAME_TYPES[nameDetail.tr.type[idx]] || nameDetail.tr.type[idx]}
            </span>
            <p className="leading-tight inline"> {detail} </p>
          </li>
        ))}
      </ul>
    </>
  );
}

export default NameDetailPage;
