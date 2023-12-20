import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import { UiButton } from '@root/src/components/ui/button';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import {
  WORD_POS_TAG,
  WORD_REASONS,
} from '@root/src/shared/constant/word.const';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { ArrowLeftIcon, Volume2Icon } from 'lucide-react';
import { useRef } from 'react';

function CommandWordDetail({
  entry,
  onClose,
}: {
  onClose?(): void;
  entry: DictionaryWordEntryResult;
}) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  const matchWord = useRef('');

  return (
    <div className="px-4 py-2">
      <button
        onClick={() => onClose?.()}
        className="flex text-muted-foreground items-center"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="ml-1">word</span>
      </button>
      <div className="flex items-start mt-2">
        <ViewReadingKanji
          entry={entry}
          onMatchWord={(word) => (matchWord.current = word)}
          className="text-lg mt-px leading-tight flex-grow"
        />
        <SharedBookmarkBtnContent
          entry={{
            id: entry.id,
            kanji: entry.kanji,
            reading: entry.reading,
            type: DICTIONARY_NAME.JMDICT,
            meaning: entry.sense.map((sense) => sense.gloss.join('; ')),
          }}
        />
        {isSpeechAvailable && (
          <UiButton
            variant="secondary"
            size="icon-xs"
            className="ml-1 flex-shrink-0"
            onClick={() => speak(matchWord.current || entry.word)}
          >
            <Volume2Icon className="h-4 w-4" />
          </UiButton>
        )}
      </div>
      {entry.reasons && (
        <div className="mt-2 space-x-1">
          {entry.reasons.map((reason) => (
            <span
              key={reason}
              className="text-xs px-1 py-0.5 bg-cyan-400/20 dark:text-cyan-400 text-cyan-700 rounded inline-block"
            >
              {WORD_REASONS[reason]}
            </span>
          ))}
          <ul className="mt-2 list-decimal pl-4 space-y-2">
            {entry.sense.map((sense, idx) => (
              <li key={idx}>
                <span className="inline space-x-0.5">
                  {sense.pos.map((pos) => (
                    <span
                      key={pos}
                      title={WORD_POS_TAG[pos].value}
                      className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
                    >
                      {WORD_POS_TAG[pos].name || pos}
                    </span>
                  ))}
                </span>
                <p className="leading-tight inline">
                  {' '}
                  {sense.gloss.join('; ')}{' '}
                </p>
                {sense.example && (
                  <div className="mt-px text-muted-foreground">
                    <p className="font-sans-jp">
                      {sense.example.sent[0]?.text}
                      {isSpeechAvailable && (
                        <Volume2Icon
                          className="h-4 w-4 cursor-pointer  inline-block"
                          onClick={() => speak(sense.example.sent[0]?.text)}
                        />
                      )}
                    </p>
                    <p className="leading-tight">
                      {sense.example.sent[1]?.text}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(entry.kanji?.length > 1 || entry.reading?.length > 1) && (
        <div className="mt-4">
          <p className="text-muted-foreground">Other forms </p>
          <ol className="opacity-90 list-disc font-sans-jp pl-4">
            {entry.kanji?.length > 1 && (
              <li>
                <p className="dark:text-indigo-400 text-indigo-600">
                  {entry.kanji?.join('、')}
                </p>
              </li>
            )}
            {entry.reading?.length > 1 && (
              <li>
                <p className="dark:text-emerald-400 text-emerald-600">
                  {entry.reading?.join('、')}
                </p>
              </li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

export default CommandWordDetail;
