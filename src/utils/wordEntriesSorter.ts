import { DictWordEntry, DictWordPriority } from '../interface/dict.interface';
import { DictionaryWordEntryResult } from '../pages/background/messageHandler/dictWordSearcher';
import { WORD_PRIORITY_WEIGHT } from '../shared/constant/word.const';

type WordEntry = DictWordEntry | DictionaryWordEntryResult;

function wordEntriesSorter(entries: WordEntry[]): WordEntry[] {
  const getScore = (items: DictWordPriority[]) => {
    let sum = 0;

    items.forEach((str) => {
      if (str.startsWith('nf')) {
        const freq = +str.slice(2);
        sum += Math.floor(65 * Math.exp(-0.1 * freq));

        return;
      }

      sum += WORD_PRIORITY_WEIGHT[str] || 0;
    });

    return sum;
  };
  const getPriority = (entry: WordEntry) => {
    if (!entry.kPrio && !entry.rPrio) return 0;

    let score = 0;
    entry.reading?.forEach((reading, index) => {
      if (
        ('word' in entry && reading !== entry.word) ||
        !entry.rPrio ||
        !entry.rPrio[index]
      )
        return;

      score = Math.max(score, getScore(entry.rPrio[index]));
    });
    entry.kanji?.forEach((kanji, index) => {
      if (
        ('word' in entry && kanji !== entry.word) ||
        !entry.kPrio ||
        !entry.kPrio[index]
      )
        return;

      score = Math.max(score, getScore(entry.kPrio[index]));
    });

    return score;
  };

  const sortedEntries = [...entries].sort((a, b) => {
    if ('word' in a && 'word' in b && a.word !== b.word) return 0;

    return getPriority(b) - getPriority(a);
  });

  return sortedEntries;
}

export default wordEntriesSorter;
