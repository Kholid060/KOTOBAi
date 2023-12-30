import { BookmarkItem } from '../interface/bookmark.interface';
import {
  PracticeQuestions,
  PRACTICE_TYPE,
  PracticeOptions,
  PracticeQuestionMultiple,
} from '../interface/practice.interface';
import { DICTIONARY_NAME } from '../shared/constant/constant';
import findRandomWords from './findRandomWords';
import { getRandomItemFromArr, shuffleArray } from './helper';

function getRandomBookmark(
  bookmarks: BookmarkItem[],
  currBookmarkId?: BookmarkItem['id'] | BookmarkItem['id'][],
  retryCount = 0,
): { bookmark: BookmarkItem; index: number } | null {
  const randomIndex = Math.floor(Math.random() * bookmarks.length);
  const randomBookmark = bookmarks[randomIndex];

  let retry = !randomBookmark;

  if (currBookmarkId && randomBookmark) {
    retry = Array.isArray(currBookmarkId)
      ? currBookmarkId.includes(randomBookmark.id)
      : currBookmarkId === randomBookmark.id;
  }

  if (retry) {
    if (retryCount > 3) return null;

    return getRandomBookmark(bookmarks, currBookmarkId, retryCount + 1);
  }

  return { bookmark: randomBookmark, index: randomIndex };
}

const getQuestion: Record<
  PRACTICE_TYPE,
  (bookmarks: BookmarkItem[], bookmark: BookmarkItem) => PracticeQuestions
> = {
  [PRACTICE_TYPE.BOOLEAN]: (bookmarks, bookmark) => {
    const answer = getRandomItemFromArr([true, false]) ?? false;
    const isKanji = bookmark.type === DICTIONARY_NAME.KANJIDIC;

    let { meaning } = bookmark;
    if (!answer) {
      const randBookmark = getRandomBookmark(bookmarks, bookmark.id);
      if (randBookmark) {
        meaning = randBookmark.bookmark.meaning;
      }
    }

    return {
      meaning,
      answer: answer + '',
      type: PRACTICE_TYPE.BOOLEAN,
      reading: isKanji ? [] : bookmark.reading,
      kanji: isKanji
        ? bookmark.kanji || []
        : bookmark.kanji || bookmark.reading,
    };
  },
  [PRACTICE_TYPE.KANJI_STROKE]: () => {
    return {
      paths: [],
      answer: '',
      choices: [],
      type: PRACTICE_TYPE.KANJI_STROKE,
    };
  },
  [PRACTICE_TYPE.MULTIPLE]: (bookmarks, bookmark) => {
    const choiceIds: number[] = [bookmark.id];
    const choices = Array.from({ length: 3 }, (_, idx) => {
      const randBookmark = getRandomBookmark(bookmarks, choiceIds);
      if (!randBookmark) return null;

      choiceIds.push(randBookmark.bookmark.id);

      return {
        id: idx.toString(),
        text: randBookmark.bookmark.meaning.slice(0, 2).join('; '),
      };
    }).filter(Boolean) as PracticeQuestionMultiple['choices'];
    const answer = choices.length.toString();

    choices.push({
      id: answer,
      text: bookmark.meaning.slice(0, 2).join('; '),
    });

    return {
      answer,
      kanji: bookmark.kanji,
      reading: bookmark.reading,
      type: PRACTICE_TYPE.MULTIPLE,
      choices: shuffleArray(choices),
    };
  },
};

const QUESTION_TYPE_WEIGHT = {
  [PRACTICE_TYPE.BOOLEAN]: 5,
  [PRACTICE_TYPE.MULTIPLE]: 3,
  [PRACTICE_TYPE.KANJI_STROKE]: 0,
};

async function practiceQuestionsGenerator(
  bookmarks: BookmarkItem[],
  { length, type }: PracticeOptions,
) {
  const randomWords: BookmarkItem[] =
    (await findRandomWords(5))?.map((item, index) => {
      return {
        createdAt: '',
        status: 'know',
        entryId: item.id,
        kanji: item.kanji,
        lastReviewedAt: '',
        id: item.id + index,
        reading: item.reading,
        type: DICTIONARY_NAME.JMDICT,
        meaning: item.sense
          .slice(0, 2)
          .map((sense) => sense.gloss.slice(0, 2).join('; ')),
      };
    }) ?? [];
  const mergedBookmarks = [...bookmarks, ...randomWords];

  const questionsTypes: PRACTICE_TYPE[] = [];
  type.forEach((item) => {
    const weight = QUESTION_TYPE_WEIGHT[item];
    questionsTypes.push(...Array.from({ length: weight }, () => item));
  });

  const questions: PracticeQuestions[] = [];

  let index = 0;

  while (index < length) {
    const { bookmark, index: bookmarkIndex } = getRandomBookmark(bookmarks)!;
    const questionType = getRandomItemFromArr(questionsTypes) as PRACTICE_TYPE;
    const question = getQuestion[questionType](mergedBookmarks, bookmark);

    questions.push(question);
    bookmarks.splice(bookmarkIndex, 1);

    index += 1;
  }

  return questions;
}

export default practiceQuestionsGenerator;
