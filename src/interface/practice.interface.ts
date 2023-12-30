import { DictKanjiVGEntryPathGroup } from './dict.interface';

export enum PRACTICE_TYPE {
  BOOLEAN = 'boolean',
  MULTIPLE = 'multiple',
  KANJI_STROKE = 'kanji-stroke',
}

export interface PracticeQuestionBoolean {
  answer: string;
  kanji: string[];
  reading: string[];
  meaning: string[];
  type: PRACTICE_TYPE.BOOLEAN;
}

export interface PracticeQuestionMultiple {
  answer: string;
  kanji?: string[];
  reading: string[];
  type: PRACTICE_TYPE.MULTIPLE;
  choices: { text: string; id: string }[];
}

export interface PracticeQuestionKanjiStroke {
  answer: string;
  type: PRACTICE_TYPE.KANJI_STROKE;
  paths: DictKanjiVGEntryPathGroup[];
  choices: { path: string; id: string }[];
}

export interface PracticeQuestionsMap {
  [PRACTICE_TYPE.BOOLEAN]: PracticeQuestionBoolean;
  [PRACTICE_TYPE.MULTIPLE]: PracticeQuestionMultiple;
  [PRACTICE_TYPE.KANJI_STROKE]: PracticeQuestionKanjiStroke;
}

export type PracticeQuestions =
  | PracticeQuestionBoolean
  | PracticeQuestionKanjiStroke
  | PracticeQuestionMultiple;

export interface PracticeOptions {
  length: number;
  type: PRACTICE_TYPE[];
}
