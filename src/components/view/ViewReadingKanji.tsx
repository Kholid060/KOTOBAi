import {
  DictNameEntry,
  DictWordEntry,
} from '@root/src/interface/dict.interface';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { useEffect } from 'react';

type DictEntry =
  | DictWordEntry
  | DictNameEntry
  | DictionaryNameEntryResult
  | DictionaryWordEntryResult;

function findMatchWord(entry: DictEntry, prop: 'kanji' | 'reading') {
  if (!('word' in entry))
    return {
      match: '',
      text: entry[prop]?.join('、') ?? '',
    };

  const match = entry[prop].find(
    (str) => str.startsWith(entry.oriWord) || str.startsWith(entry.word),
  );

  return {
    match,
    text: match ? '' : entry[prop].join('、'),
  };
}

function ViewReadingKanji({
  entry,
  className,
  onMatchWord,
  ...props
}: {
  entry: DictEntry;
  onMatchWord?: (word: string) => void;
} & React.DetailsHTMLAttributes<HTMLParagraphElement>) {
  const matchKanji = entry.kanji && findMatchWord(entry, 'kanji');
  const matchReading = entry.reading && findMatchWord(entry, 'reading');

  useEffect(() => {
    onMatchWord?.(matchKanji?.match || matchReading?.match);
  }, [matchKanji, matchReading, onMatchWord]);

  return (
    <p className={cn('font-sans-jp leading-tight', className)} {...props}>
      {matchKanji && (
        <span
          className={cn(
            'mr-2',
            matchKanji.match
              ? 'dark:text-indigo-400 text-indigo-600 font-semibold'
              : 'dark:text-indigo-400/90 text-indigo-600/90',
          )}
        >
          {matchKanji.match || matchKanji.text}
        </span>
      )}
      {matchReading && (
        <span
          className={cn(
            'mr-2',
            matchReading.match
              ? 'font-semibold dark:text-emerald-400 text-emerald-700'
              : 'dark:text-emerald-400/90 text-emerald-700/90',
          )}
        >
          {matchReading.match || matchReading.text}
        </span>
      )}
    </p>
  );
}

export default ViewReadingKanji;
