import { DictWordEntry } from '@root/src/interface/dict.interface';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { useEffect } from 'react';

type EntryType = Pick<DictWordEntry, 'kanji' | 'reading'> & {
  oriWord?: string;
  word?: string;
};

function findMatchWord(entry: EntryType, prop: 'kanji' | 'reading') {
  if (!entry.word) {
    return {
      match: '',
      text: entry[prop]?.join('、') ?? '',
    };
  }

  const match = entry[prop]?.find(
    (str) =>
      (entry.oriWord && str.startsWith(entry.oriWord)) ||
      (entry.word && str.startsWith(entry.word)),
  );

  return {
    match,
    text: match ? '' : entry[prop]?.join('、'),
  };
}

function ViewReadingKanji({
  entry,
  className,
  onMatchWord,
  ...props
}: {
  entry: EntryType;
  onMatchWord?: (word: string) => void;
} & React.DetailsHTMLAttributes<HTMLParagraphElement>) {
  const matchKanji = entry.kanji && findMatchWord(entry, 'kanji');
  const matchReading = entry.reading && findMatchWord(entry, 'reading');

  useEffect(() => {
    const matchWord = matchKanji?.match
      ? entry.reading[0]
      : matchReading?.match;
    if (matchWord) onMatchWord?.(matchWord);
  }, [matchKanji, matchReading, onMatchWord, entry.reading]);

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
