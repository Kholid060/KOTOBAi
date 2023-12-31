import { memo, useContext, useRef } from 'react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { UiButton } from '@root/src/components/ui/button';
import { Volume2Icon } from 'lucide-react';
import { DictionaryWordEntryResult } from '../../../background/messageHandler/dictWordSearcher';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import RuntimeMessage, {
  BookmarkDictionaryPayload,
} from '@root/src/utils/RuntimeMessage';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import ViewWordEntry from '@root/src/components/view/ViewWordEntry';
import { AppContentContext } from '../app';
import { ExtensionSettingsPopup } from '@root/src/shared/storages/extSettingsStorage';
import { EXT_POPUP_FONT_SIZE } from '@root/src/shared/constant/ext-settings.const';

function WordEntry({
  entry,
  onSpeak,
  settings,
  speechAvailable,
}: {
  speechAvailable?: boolean;
  onSpeak?: (str: string) => void;
  settings: ExtensionSettingsPopup;
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
      <ViewWordEntry.Meta entry={entry} className="mt-2" />
      {settings.showDefinition && (
        <ViewWordEntry.Sense
          tooltipExample
          sense={entry.sense}
          showPOS={settings.showPOS}
          className="mt-2 space-y-1"
        />
      )}
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
  entries,
  className,
  ...props
}: {
  entries: DictionaryWordEntryResult[];
  onBookmark?: (payload: BookmarkDictionaryPayload) => void;
} & React.DetailsHTMLAttributes<HTMLDivElement>) {
  const appCtx = useContext(AppContentContext);

  const containerRef = useRef<HTMLDivElement>(null);

  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  const settings = appCtx.extSettings.popup;

  return (
    <div
      ref={containerRef}
      id="words-section"
      className={cn(
        'divide-y space-y-4 px-4 pb-4',
        className,
        EXT_POPUP_FONT_SIZE[settings.fontSize].className,
      )}
      {...props}
    >
      {entries.map((entry) => (
        <WordEntry
          key={entry.id}
          entry={entry}
          onSpeak={speak}
          settings={settings}
          speechAvailable={isSpeechAvailable}
        />
      ))}
    </div>
  );
}

export default memo(WordEntries);
