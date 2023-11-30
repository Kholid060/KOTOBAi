import { WORD_POS_TAG } from '@src/shared/constant/word-tag.const';

export type DictLoadState = 'not_loaded' | 'loading_data' | 'loaded';

export type WordPosTag = keyof typeof WORD_POS_TAG;

export interface DictWordEntryExample {
  text: string;
  sourceId: string;
  sent: { text: string; lang: string }[];
}

export interface DictWordEntrySense {
  gloss: string[];
  pos: WordPosTag[];
  example?: DictWordEntryExample;
}

export interface DictWordEntry {
  id: number;
  kanji?: string[];
  reading: string[];
  sense: DictWordEntrySense[];
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
