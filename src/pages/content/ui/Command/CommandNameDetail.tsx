import { UiButton } from '@root/src/components/ui/button';
import UiTooltip from '@root/src/components/ui/tooltip';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import { NAME_TYPES } from '@root/src/shared/constant/word.const';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { ArrowLeftIcon, BookmarkIcon, Volume2Icon } from 'lucide-react';
import { useRef } from 'react';

function CommandNameDetail({
  entry,
  onClose,
}: {
  onClose?(): void;
  entry: DictionaryNameEntryResult;
}) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  const matchWord = useRef('');

  return (
    <div className="px-4 py-2">
      <button
        className="flex text-muted-foreground items-center"
        onClick={() => onClose?.()}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="ml-1">name</span>
      </button>
      <div className="flex items-start mt-2">
        <ViewReadingKanji
          entry={entry}
          onMatchWord={(word) => (matchWord.current = word)}
          className="text-lg mt-px leading-tight flex-grow"
        />
        <UiTooltip label="Bookmark word">
          <UiButton
            className="ml-2 flex-shrink-0"
            size="icon-xs"
            variant="secondary"
          >
            <BookmarkIcon className="h-4 w-4" />
          </UiButton>
        </UiTooltip>
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
      <ul className="mt-2 list-decimal pl-4 space-y-2">
        {entry.tr.detail.map((detail, idx) => (
          <li key={idx}>
            <span
              title={NAME_TYPES[entry.tr.type[idx]].value}
              className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
            >
              {NAME_TYPES[entry.tr.type[idx]].name || entry.tr.type[idx]}
            </span>
            <p className="leading-tight inline"> {detail} </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CommandNameDetail;