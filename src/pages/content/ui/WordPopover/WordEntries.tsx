import { memo, useRef } from 'react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { UiButton } from '@root/src/components/ui/button';
import { Volume2Icon } from 'lucide-react';
import {
  WORD_POS_TAG,
  WORD_REASONS,
} from '@root/src/shared/constant/word.const';
import {
  DictionaryWordEntryResult,
  SearchDictWordResult,
} from '../../../background/messageHandler/dictWordSearcher';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { BookmarkDictionaryPayload } from '@root/src/utils/RuntimeMessage';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';

function WordEntry({
  entry,
  onSpeak,
  speechAvailable,
}: {
  speechAvailable?: boolean;
  onSpeak?: (str: string) => void;
  entry: DictionaryWordEntryResult;
}) {
  return (
    <div className="pt-4">
      <div className="flex items-start">
        <ViewReadingKanji
          entry={entry}
          className="text-lg leading-tight pt-0.5 flex-grow"
        />
        <SharedBookmarkBtnContent
          entry={{ id: entry.id, type: DICTIONARY_NAME.JMDICT }}
        />
        {speechAvailable && (
          <UiButton
            variant="secondary"
            size="icon-xs"
            className="ml-1 flex-shrink-0"
            onClick={() => onSpeak?.(entry.word)}
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
        </div>
      )}
      <ul className="mt-2 list-decimal pl-4 space-y-1">
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
            <p className="leading-tight inline"> {sense.gloss.join('; ')} </p>
            {sense.example && (
              <div className="mt-px">
                <div className="text-muted-foreground inline-block text-xs border px-1 py-0.5 rounded underline has-tooltip">
                  <span className="tooltip leading-tight rounded-md text-left shadow-lg p-1 text-sm bg-popover mt-5 border px-2 py-1">
                    <p className="font-sans-jp">
                      {sense.example.sent[0]?.text}
                    </p>
                    <p className="mt-1">{sense.example.sent[1]?.text}</p>
                  </span>
                  See example
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WordEntries({
  result,
  className,
  ...props
}: {
  result: SearchDictWordResult;
  onBookmark?: (payload: BookmarkDictionaryPayload) => void;
} & React.DetailsHTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  return (
    <div
      ref={containerRef}
      id="words-section"
      className={cn('divide-y space-y-4 px-4 pb-4', className)}
      {...props}
    >
      {result.entries.map((entry) => (
        <WordEntry
          key={entry.id}
          entry={entry}
          onSpeak={speak}
          speechAvailable={isSpeechAvailable}
        />
      ))}
    </div>
  );
}

export default memo(WordEntries);
