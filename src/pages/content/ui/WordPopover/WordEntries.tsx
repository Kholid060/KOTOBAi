import { memo, useRef } from 'react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { UiButton } from '@root/src/components/ui/button';
import { Volume2Icon } from 'lucide-react';
import { WORD_REASONS } from '@root/src/shared/constant/word.const';
import {
  DictionaryWordEntryResult,
  SearchDictWordResult,
} from '../../../background/messageHandler/dictWordSearcher';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import RuntimeMessage, {
  BookmarkDictionaryPayload,
} from '@root/src/utils/RuntimeMessage';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import ViewWordSense from '@root/src/components/view/ViewWordSense';

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
          entry={{
            id: entry.id,
            kanji: entry.kanji,
            reading: entry.reading,
            type: DICTIONARY_NAME.JMDICT,
            meaning: entry.sense.map((sense) => sense.gloss.join('; ')),
          }}
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
      <ViewWordSense
        tooltipExample
        sense={entry.sense}
        className="mt-2 space-y-1"
      />
      <div className="text-right mt-1">
        <button
          className="underline text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            RuntimeMessage.sendMessage(
              'background:dashboard-open',
              `/words/${entry.id}`,
            );
          }}
        >
          <span>See detail</span>
        </button>
      </div>
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
