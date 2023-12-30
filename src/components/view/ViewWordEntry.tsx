import {
  DictWordEntry,
  DictWordEntrySense,
} from '@root/src/interface/dict.interface';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { NON_JP_CHARS_REGEX } from '@root/src/shared/constant/char.const';
import {
  WORD_KANJI_INFO_TAG,
  WORD_MISC_TAG,
  WORD_POS_TAG,
  WORD_REASONS,
} from '@root/src/shared/constant/word.const';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { Volume2Icon } from 'lucide-react';
import { Fragment } from 'react';

type WordPosTagKey = keyof typeof WORD_POS_TAG;

function SenseXref({
  sense,
  onSearch,
}: {
  sense: DictWordEntrySense;
  onSearch?: (detail: { word: string; fullText: string }) => void;
}) {
  if (!sense.xref) return null;

  const refs = sense.xref.map((wordRef) => {
    const xref = wordRef.replaceAll(new RegExp(NON_JP_CHARS_REGEX, 'g'), '');
    const [word] = xref.split('・');

    return { fullText: wordRef, word };
  });

  return (
    <span className="text-muted-foreground text-sm ml-2">
      See also
      {refs.map((item, index) => (
        <Fragment key={item.word}>
          <button
            className="underline font-sans-jp ml-1"
            onClick={() => onSearch?.(item)}
          >
            {item.fullText}
          </button>
          {index === refs.length - 1 ? '' : '、'}
        </Fragment>
      ))}
    </span>
  );
}

function ViewWordSense({
  sense,
  className,
  onSearchXRef,
  showReference,
  tooltipExample,
  showPOS = true,
  ...props
}: {
  showPOS?: boolean;
  showReference?: boolean;
  tooltipExample?: boolean;
  sense: DictWordEntrySense[];
  onSearchXRef?: (detail: { word: string; fullText: string }) => void;
} & React.HTMLAttributes<HTMLUListElement>) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  return (
    <ul className={cn('list-decimal pl-4', className)} {...props}>
      {sense.map((currSense, idx) => (
        <li key={idx}>
          {showPOS && (
            <span className="inline space-x-0.5">
              {[
                ...currSense.pos,
                ...(currSense.misc ? currSense.misc : []),
              ].map((pos) => (
                <span
                  key={pos}
                  title={
                    WORD_POS_TAG[pos as WordPosTagKey]?.value ||
                    WORD_MISC_TAG[pos]?.value
                  }
                  className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
                >
                  {WORD_POS_TAG[pos as WordPosTagKey]?.name ||
                    WORD_MISC_TAG[pos]?.name ||
                    pos}
                </span>
              ))}
            </span>
          )}
          <p className="leading-tight inline">
            {' '}
            {currSense.gloss.join('; ')}{' '}
            {showReference && currSense.xref && (
              <SenseXref sense={currSense} onSearch={onSearchXRef} />
            )}
          </p>
          {currSense.example &&
            (tooltipExample ? (
              <div className="mt-px">
                <div className="text-muted-foreground inline-block text-xs border px-1 py-0.5 rounded underline has-tooltip">
                  <span className="tooltip leading-tight rounded-md text-left shadow-lg p-1 text-sm bg-popover mt-5 border px-2 py-1">
                    <p className="font-sans-jp">
                      {currSense.example.sent[0]?.text}
                    </p>
                    <p className="mt-1">{currSense.example.sent[1]?.text}</p>
                  </span>
                  See example
                </div>
              </div>
            ) : (
              <div className="mt-px text-muted-foreground">
                <p className="font-sans-jp">
                  {currSense.example.sent[0]?.text}
                  {isSpeechAvailable && (
                    <Volume2Icon
                      className="h-4 w-4 cursor-pointer  inline-block"
                      onClick={() => speak(currSense.example!.sent[0]?.text)}
                    />
                  )}
                </p>
                <p className="leading-tight">
                  {currSense.example.sent[1]?.text}
                </p>
              </div>
            ))}
        </li>
      ))}
    </ul>
  );
}

function ViewWordMeta({
  entry,
  className,
  ...props
}: {
  entry: DictWordEntry | DictionaryWordEntryResult;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!('reasons' in entry || entry.common)) return null;

  return (
    <div className={cn('space-x-1', className)} {...props}>
      {entry.common && (
        <span className="text-xs px-1 py-0.5 bg-emerald-400/20 dark:text-emerald-400 text-emerald-700 rounded inline-block">
          common word
        </span>
      )}
      {(entry as DictionaryWordEntryResult).reasons?.map((reason) => (
        <span
          key={reason}
          className="text-xs px-1 py-0.5 bg-cyan-400/20 dark:text-cyan-400 text-cyan-700 rounded inline-block"
        >
          {WORD_REASONS[reason]}
        </span>
      ))}
    </div>
  );
}

function ViewWordOtherForms({ entry }: { entry: DictWordEntry }) {
  const { kanji, kInfo, reading } = entry;
  if ((!kanji || kanji.length <= 1) && reading.length <= 1) return null;

  return (
    <>
      <p className="font-semibold text-muted-foreground">Other Forms </p>
      <ol className="opacity-90 list-disc font-sans-jp pl-4">
        {kanji && kanji.length > 1 && (
          <li>
            <p className="dark:text-indigo-400 text-indigo-600">
              {kanji?.map((str, index) => {
                const info = kInfo?.[index]
                  ?.filter((item) => item !== 'sK')
                  .map(
                    (item) =>
                      WORD_KANJI_INFO_TAG[
                        item as keyof typeof WORD_KANJI_INFO_TAG
                      ]?.value,
                  );

                return (
                  <span key={index}>
                    <span>{str}</span>
                    {info && info.length > 0 && (
                      <span className="font-sans text-muted-foreground">
                        【{info.join(', ')}】
                      </span>
                    )}
                    {index !== kanji!.length - 1 ? '、' : ''}
                  </span>
                );
              })}
            </p>
          </li>
        )}
        {reading?.length > 1 && (
          <li>
            <p className="dark:text-emerald-400 text-emerald-600">
              {reading?.join('、')}
            </p>
          </li>
        )}
      </ol>
    </>
  );
}

const ViewWordEntry = {
  Meta: ViewWordMeta,
  Sense: ViewWordSense,
  OtherForms: ViewWordOtherForms,
};

export default ViewWordEntry;
