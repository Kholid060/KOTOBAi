import { DictWordEntry } from '../interface/dict.interface';
import dictDB from '../shared/db/dict.db';
import { getRandomArbitrary } from './helper';

const WORD_MIN_ID = 1000000;
const WORD_MAX_ID = 2859479;
const getRandWordId = (max: number, remainder?: number) =>
  Math.ceil(getRandomArbitrary(WORD_MIN_ID, max, remainder));

async function findRandomWords(
  maxLength = 1,
  retryCount = 0,
  result: DictWordEntry[] = [],
): Promise<DictWordEntry[] | null> {
  const length = await dictDB.words.count();
  if (length <= 0 || retryCount > 3) return null;

  const ids = Array.from({ length: 5 }, (_, idx) => {
    const withoutRemainder = idx > 2;

    return getRandWordId(
      withoutRemainder ? WORD_MAX_ID : 2000000,
      withoutRemainder ? undefined : 10,
    );
  });
  const words = await dictDB.words.bulkGet(ids);
  const findedWords = words.filter(Boolean) as DictWordEntry[];
  result.push(...findedWords);

  if (result.length >= maxLength) return result.slice(0, maxLength);

  return await findRandomWords(maxLength, retryCount + 1, result);
}

export default findRandomWords;
