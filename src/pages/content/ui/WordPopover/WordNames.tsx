import { memo } from 'react';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { UiButton } from '@root/src/components/ui/button';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { NAME_TYPES } from '@root/src/shared/constant/word.const';
import { Volume2Icon } from 'lucide-react';
import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';

type NameTypeKey = keyof typeof NAME_TYPES;

function WordKanji({
  entries,
  className,
  ...props
}: {
  entries: DictionaryNameEntryResult[];
} & React.DetailsHTMLAttributes<HTMLDivElement>) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  if (entries.length <= 0) return null;

  return (
    <div
      className={cn('pb-4 px-4 space-y-4 divide-y', className)}
      id="names-section"
      {...props}
    >
      {entries.map((name) => (
        <div key={name.id} className="pt-4">
          <div className="flex items-start">
            <ViewReadingKanji
              entry={name}
              className="text-lg leading-tight pt-0.5 flex-grow"
            />
            <SharedBookmarkBtnContent
              entry={{
                id: name.id,
                kanji: name.kanji,
                reading: name.reading,
                meaning: name.tr.detail,
                type: DICTIONARY_NAME.ENAMDICT,
              }}
            />
            {isSpeechAvailable && (
              <UiButton
                variant="secondary"
                size="icon-xs"
                className="ml-1 flex-shrink-0"
                onClick={() => speak?.(name.word)}
              >
                <Volume2Icon className="h-4 w-4" />
              </UiButton>
            )}
          </div>
          <ul className="mt-2 list-decimal pl-4 space-y-1">
            {name.tr.detail.map((detail, idx) => (
              <li key={idx}>
                <span
                  title={NAME_TYPES[name.tr.type[idx] as NameTypeKey]}
                  className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
                >
                  {NAME_TYPES[name.tr.type[idx] as NameTypeKey] ||
                    name.tr.type[idx]}
                </span>{' '}
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default memo(WordKanji);
