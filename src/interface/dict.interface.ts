import {
  WORD_POS_TAG,
  WORD_PRIORITY_WEIGHT,
} from '@root/src/shared/constant/word.const';

export type DictLoadState = 'not_loaded' | 'loading_data' | 'loaded';

export type DictWordPosTag = keyof typeof WORD_POS_TAG;

export type DictWordPriority =
  | keyof typeof WORD_PRIORITY_WEIGHT
  | `nf${number}`;

export type DictWordEntryPriority = Record<number, DictWordPriority[]>;

export interface DictWordEntryExample {
  text: string;
  sourceId: string;
  sent: { text: string; lang: string }[];
}

export interface DictWordEntrySense {
  gloss: string[];
  pos: DictWordPosTag[];
  example?: DictWordEntryExample;
}

export interface DictWordEntry {
  id: number;
  kanji?: string[];
  reading: string[];
  sense: DictWordEntrySense[];
  rPrio?: DictWordEntryPriority;
  kPrio?: DictWordEntryPriority;
}

export interface DictWordLocalEntry extends DictWordEntry {
  sense: Pick<DictWordEntrySense, 'pos' | 'gloss'>[];
}

export interface DictKanjiEntryReading {
  ja_on?: string[];
  pinyin?: string[];
  ja_kun?: string[];
  nanori?: string[];
}

export interface DictKanjiEntry {
  literal: string;
  misc: {
    jlpt?: number;
    freq?: number;
    grade?: number;
    stroke_count?: number;
  };
  meanings: string[];
  dicts: Record<string, number>;
  reading: DictKanjiEntryReading;
}

export interface DictMetadata {
  version: string;
  dataCreatedAt: string;
}

export interface KanjiDictMetadata {
  version: string;
  fileVersion: string;
  dataCreatedAt: string;
  databaseVersion: string;
}

export interface DictNameEntry {
  id: number;
  kanji: string[];
  reading: string[];
  tr: { detail: string[]; type: string[] };
}
