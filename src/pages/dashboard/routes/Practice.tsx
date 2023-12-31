import UiProgress from '@root/src/components/ui/progress';
import {
  BOOKMARK_ITEM_STATUS,
  BookmarkItem,
} from '@root/src/interface/bookmark.interface';
import bookmarkDB from '@root/src/shared/db/bookmark.db';
import { XIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffectOnce, useUpdateEffect } from 'usehooks-ts';
import {
  PRACTICE_TYPE,
  PracticeOptions,
  PracticeQuestions,
} from '../../../interface/practice.interface';
import { useRef, useState } from 'react';
import practiceQuestionsGenerator from '@root/src/utils/practiceQuestionGenerator';
import PracticeQuestion from '@root/src/components/Pratice/PracticeQuestion';
import UiCircleProgress from '@root/src/components/ui/circle-progress';
import { UiButton } from '@root/src/components/ui/button';
import statsDB from '@root/src/shared/db/stats.db';
import { useTitle } from '@root/src/shared/hooks/useTitle';

function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const correctCount = useRef(0);

  const [isLoading, setIsLoading] = useState(false);

  const [questionIdx, setQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<PracticeQuestions[]>([]);

  useTitle('Practice');

  function onAnswer(isCorrect: boolean) {
    if (isCorrect) correctCount.current += 1;

    setQuestionIdx(questionIdx + 1);
  }

  const isFinished = !isLoading && questionIdx >= questions.length;
  const score = isFinished
    ? Math.min(100, Math.round((correctCount.current / questions.length) * 100))
    : 0;

  useUpdateEffect(() => {
    if (!isFinished) return;

    statsDB.incrementStat(new Date());
  }, [isFinished]);
  useEffectOnce(() => {
    (async () => {
      try {
        setIsLoading(true);

        const bookmarks = (await bookmarkDB.items
          .where('status')
          .equals(BOOKMARK_ITEM_STATUS.LEARN)
          .toArray()) as BookmarkItem[];

        if (bookmarks.length === 0) {
          navigate('/', { replace: true });
          return;
        }

        const practiceSetup: PracticeOptions = location.state?.practice || {
          length: bookmarks.length,
          type: [
            PRACTICE_TYPE.MULTIPLE,
            PRACTICE_TYPE.BOOLEAN,
            PRACTICE_TYPE.KANJI_STROKE,
          ],
        };
        const generatedQuestions = await practiceQuestionsGenerator(
          bookmarks,
          practiceSetup,
        );
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();
  });

  return (
    <div className="flex flex-col max-w-2xl px-4 gap-8 w-full overflow-hidden py-12 h-screen mx-auto relative">
      <div className="flex items-center gap-4">
        <Link to="/">
          <XIcon />
        </Link>
        <UiProgress
          className="flex-grow"
          value={((questionIdx + 1) / questions.length) * 100}
        />
        <p className="text-muted-foreground tabular-nums">
          {Math.min(questionIdx + 1, questions.length)}/{questions.length}
        </p>
      </div>
      {isLoading ? (
        <p className="text-center mt-8 text-muted-foreground">
          Generating questions...
        </p>
      ) : isFinished ? (
        <>
          <div className="flex items-center justify-center">
            <UiCircleProgress value={score} />
            <div className="absolute text-center">
              <p className="text-4xl font-semibold">{score}</p>
              <p className="text-muted-foreground text-sm">score</p>
            </div>
          </div>
          <div className="flex gap-4 mt-8 max-w-md w-full mx-auto">
            <div className="w-6/12 border rounded-lg text-amber-600 dark:text-amber-400 text-center py-6">
              <p className="text-2xl font-semibold">
                {questions.length - correctCount.current}
              </p>
              <p>Incorrect answers</p>
            </div>
            <div className="w-6/12 border rounded-lg text-emerald-600 dark:text-emerald-400 text-center py-6">
              <p className="text-2xl font-semibold">{correctCount.current}</p>
              <p>Correct answers</p>
            </div>
          </div>
          <UiButton
            asChild
            className="mt-12 max-w-md mx-auto w-full"
            variant="ghost"
          >
            <Link to="/">Back to dashboard</Link>
          </UiButton>
        </>
      ) : (
        <PracticeQuestion
          index={questionIdx}
          onAnswer={onAnswer}
          questions={questions}
        />
      )}
    </div>
  );
}

export default PracticePage;
