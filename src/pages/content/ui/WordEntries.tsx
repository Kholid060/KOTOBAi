import { memo, useState } from 'react';
import {
  DictionaryEntryResult,
  SearchDictWordResult,
} from '../../background/messageHandler/dictWordSearcher';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { UiButton } from '@root/src/components/ui/button';
import { BookmarkIcon, Volume2Icon } from 'lucide-react';
import { useEffectOnce } from 'usehooks-ts';
import {
  WORD_POS_TAG,
  WORD_REASON as WORD_REASONS,
} from '@root/src/shared/constant/word.const';

const SYNTH_LANG = 'ja-JP';

function findMatchWord(
  entry: DictionaryEntryResult,
  prop: 'kanji' | 'reading',
) {
  const match = entry[prop].find(
    (str) => str === entry.oriWord || str === entry.word,
  );

  return {
    match,
    text: match ? '' : entry[prop].join('、'),
  };
}

function WordEntry({
  entry,
  speechAvailable,
}: {
  entry: DictionaryEntryResult;
  speechAvailable?: boolean;
}) {
  const matchKanji = entry.kanji && findMatchWord(entry, 'kanji');
  const matchReading = entry.reading && findMatchWord(entry, 'reading');

  function speakWord() {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance();
    speech.lang = SYNTH_LANG;
    speech.text = entry.word;

    window.speechSynthesis.speak(speech);
  }

  if (entry.reasons.length > 0) {
    console.log(entry, entry.reasons);
  }

  return (
    <div className="mb-4">
      <div className="flex items-start">
        <p className="flex-grow font-sans-jp text-lg leading-tight pt-0.5">
          {matchKanji && (
            <span
              className={cn(
                'mr-2',
                matchKanji.match
                  ? 'text-indigo-400 font-semibold'
                  : 'text-indigo-400/90',
              )}
            >
              {matchKanji.match || matchKanji.text}
            </span>
          )}
          {matchReading && (
            <span
              className={cn(
                'mr-2 text-emerald-400 tracking-[-2px]',
                matchReading.match && 'font-semibold',
              )}
            >
              {matchReading.match || matchReading.text}
            </span>
          )}
        </p>
        <UiButton
          className="ml-1 flex-shrink-0"
          size="icon-xs"
          variant="secondary"
        >
          <BookmarkIcon className="h-4 w-4" />
        </UiButton>
        {speechAvailable && (
          <UiButton
            variant="secondary"
            size="icon-xs"
            className="ml-1 flex-shrink-0"
            onClick={speakWord}
          >
            <Volume2Icon className="h-4 w4" />
          </UiButton>
        )}
      </div>
      {entry.reasons && (
        <div className="mt-2 space-x-1">
          {entry.reasons.map((reason) => (
            <span
              key={reason}
              className="text-xs px-1 py-0.5 bg-cyan-400/20 text-cyan-400 rounded inline-block"
            >
              {WORD_REASONS[reason]}
            </span>
          ))}
        </div>
      )}
      <ul className="mt-2 list-decimal pl-4 space-y-1">
        {entry.sense.map((sense, idx) => (
          <li key={idx}>
            <p className="leading-tight">{sense.gloss.join('; ')} </p>
            <div className="mt-px flex gap-1 flex-wrap items-center">
              {sense.example && (
                <div className="text-muted-foreground inline-block text-xs border px-1 py-0.5 rounded underline has-tooltip">
                  <span className="tooltip leading-tight rounded-md text-left shadow-lg p-1 text-sm bg-popover mt-5 border px-2 py-1">
                    <p className="font-sans-jp">
                      {sense.example.sent[0]?.text}
                    </p>
                    <p className="mt-1">{sense.example.sent[1]?.text}</p>
                  </span>
                  See example
                </div>
              )}
              {sense.pos.map((pos) => (
                <span
                  key={pos}
                  title={WORD_POS_TAG[pos].value}
                  className="text-xs px-1 py-0.5 bg-fuchsia-400/20 text-fuchsia-400 rounded inline-block"
                >
                  {WORD_POS_TAG[pos].name || pos}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WordEntries({ result }: { result: SearchDictWordResult }) {
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);

  useEffectOnce(() => {
    const checkSpeechAvailability = () => {
      const isAvailable = window.speechSynthesis
        .getVoices()
        .some((voice) => voice.lang === SYNTH_LANG);
      setIsSpeechAvailable(isAvailable);
    };
    checkSpeechAvailability();

    window.speechSynthesis.onvoiceschanged = () => {
      checkSpeechAvailability();
    };
  });

  return (
    <>
      {result.entries.map((entry) => (
        <WordEntry
          key={entry.id}
          entry={entry}
          speechAvailable={isSpeechAvailable}
        />
      ))}
    </>
  );
}

export default memo(WordEntries);
