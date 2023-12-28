import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import { UiButton } from '@root/src/components/ui/button';
import UiTooltip from '@root/src/components/ui/tooltip';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import ViewWordEntry from '@root/src/components/view/ViewWordEntry';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { ArrowLeftIcon, ExternalLink, Volume2Icon } from 'lucide-react';
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
        <UiTooltip label="See detail">
          <UiButton
            variant="secondary"
            className="ml-1"
            size="icon-xs"
            onClick={() => {
              RuntimeMessage.sendMessage(
                'background:dashboard-open',
                `/words/${entry.id}`,
              );
            }}
          >
            <ExternalLink className="h-4 w-4" />
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
      <ViewWordEntry.Meta entry={entry} className="mt-2" />
      <ViewWordEntry.Sense sense={entry.sense} className="mt-2 space-y-1" />
      <div className="mt-2">
        <ViewWordEntry.OtherForms entry={entry} />
      </div>
    </div>
  );
}

export default CommandWordDetail;
