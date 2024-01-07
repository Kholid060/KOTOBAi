/* eslint-disable react/prop-types */
import {
  PRACTICE_TYPE,
  PracticeQuestions,
  PracticeQuestionsMap,
} from '@root/src/interface/practice.interface';
import { FC, useState } from 'react';
import { UiButton } from '../ui/button';
import ViewReadingKanji from '../view/ViewReadingKanji';
import { CheckIcon, XIcon } from 'lucide-react';
import { useEventListener } from 'usehooks-ts';

type QuestionComponentType<T extends PRACTICE_TYPE = PRACTICE_TYPE> = FC<{
  question: PracticeQuestionsMap[T];
  onAnswer?: (answer: string) => void;
}>;

const QuestionMultiple: QuestionComponentType<PRACTICE_TYPE.MULTIPLE> = ({
  question,
  onAnswer,
}) => {
  const kanji = question.kanji?.slice(0, 2);
  const reading = question.reading.slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex items-center">
        <ViewReadingKanji entry={{ kanji, reading }} className="text-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {question.choices.map((choice) => (
          <UiButton
            key={choice.id}
            title={choice.text}
            variant="secondary"
            onClick={() => onAnswer?.(choice.id)}
            className="h-auto whitespace-normal leading-tight dark:highlight-white/10 min-h-[40px]"
          >
            <span className="line-clamp-2">{choice.text}</span>
          </UiButton>
        ))}
      </div>
    </div>
  );
};

const QuestionBoolean: QuestionComponentType<PRACTICE_TYPE.BOOLEAN> = ({
  question,
  onAnswer,
}) => {
  const kanji = question.kanji.slice(0, 2);
  const reading = question.reading.slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col justify-center text-lg">
        <ViewReadingKanji entry={{ reading, kanji }} className="text-2xl" />
        <p className="leading-tight border-t pt-2 mt-2 border-border/40 first-letter:capitalize">
          {question.meaning.slice(0, 2).join('; ')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {['true', 'false'].map((val) => (
          <UiButton
            key={val}
            size="lg"
            variant="secondary"
            className="capitalize dark:highlight-white/10"
            onClick={() => onAnswer?.(val)}
          >
            {val}
          </UiButton>
        ))}
      </div>
    </div>
  );
};

const QuestionKanjiStroke: QuestionComponentType<
  PRACTICE_TYPE.KANJI_STROKE
> = () => {
  return null;
};

const questionCompsMap = {
  [PRACTICE_TYPE.BOOLEAN]: QuestionBoolean,
  [PRACTICE_TYPE.MULTIPLE]: QuestionMultiple,
  [PRACTICE_TYPE.KANJI_STROKE]: QuestionKanjiStroke,
};

function PracticeQuestion({
  index,
  onAnswer,
  questions,
}: {
  index: number;
  questions: PracticeQuestions[];
  onAnswer?: (correct: boolean) => void;
}) {
  const [answering, setAnswering] = useState({
    show: false,
    correct: false,
    correctAnswer: '',
  });

  const question = questions[index];
  const QuestionComponent = questionCompsMap[
    question.type
  ] as QuestionComponentType;

  useEventListener('keydown', ({ code }) => {
    if (code !== 'Enter' || !answering.show || answering.correct) return;

    nextQuestion(false);
  });

  function nextQuestion(isCorrect?: boolean) {
    onAnswer?.(isCorrect ?? answering.correct);
    setAnswering({
      show: false,
      correct: false,
      correctAnswer: '',
    });
  }
  function answerQuestion(answer: string) {
    if (answering.show || !question) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    let correctAnswer = '';
    switch (question.type) {
      case PRACTICE_TYPE.KANJI_STROKE:
        correctAnswer = '';
        break;
      case PRACTICE_TYPE.BOOLEAN:
        correctAnswer = question.answer;
        break;
      case PRACTICE_TYPE.MULTIPLE:
        correctAnswer =
          question.choices.find((choice) => choice.id === question.answer)
            ?.text ?? '';
        break;
    }

    const isCorrect = answer === question.answer;

    setAnswering({
      show: true,
      correctAnswer,
      correct: isCorrect,
    });

    if (isCorrect) {
      setTimeout(() => nextQuestion(true), 1000);
    }
  }

  return (
    <>
      <div className="flex-grow max-h-[800px]">
        <QuestionComponent question={question} onAnswer={answerQuestion} />
      </div>
      {answering.show && (
        <div className="absolute px-6 py-4 gap-4 rounded-lg flex items-center bottom-12 left-0 w-full bg-popover border shadow-xl">
          {answering.correct ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckIcon className="inline-block mr-1 align-top -ml-1" />{' '}
              Correct Answer
            </p>
          ) : (
            <>
              <div className="flex-grow">
                <p className="text-red-600 dark:text-red-400 font-semibold">
                  <XIcon className="inline-block mr-1 align-top -ml-1" />
                  Incorrect Answer
                </p>
                <p className="line-clamp-1">
                  Correct answer: {answering.correctAnswer}
                </p>
              </div>
              <UiButton onClick={() => nextQuestion(false)}>Continue</UiButton>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default PracticeQuestion;
