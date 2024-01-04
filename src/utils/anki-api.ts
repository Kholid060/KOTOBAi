import extSettingsStorage from '../shared/storages/extSettingsStorage';
import { $fetch } from './fetch';

const ANKI_CONNECT_VERSION = 6;

export const ANKI_CONNECT_DEFAULT_BASE_URL = 'http://127.0.0.1:8765';

export const ANKI_DECK_NAME = 'Kotobai:bookmarks';

export interface AnkiAddNoteParam {
  tags?: string;
  notes?: string;
  reading: string;
  meaning: string;
  expression: string;
}

export class AnkiApi {
  static ankiInstance?: AnkiApi;

  private apiKey = '';
  private version = ANKI_CONNECT_VERSION;

  baseURL = ANKI_CONNECT_DEFAULT_BASE_URL;

  constructor(url?: string) {
    this.baseURL = url || this.baseURL;

    extSettingsStorage.subscribe(() => {
      extSettingsStorage.get().then(({ anki }) => {
        this.apiKey = anki.apiKey || '';
        this.baseURL = anki.apiURL || ANKI_CONNECT_DEFAULT_BASE_URL;
      });
    });
  }

  static get instance() {
    if (!this.ankiInstance) {
      this.ankiInstance = new AnkiApi();
    }

    return this.ankiInstance;
  }

  private ankiFetch<T = unknown>(
    action: string,
    params: unknown = {},
  ): Promise<{ result: T | null; error: null | string }> {
    return $fetch(this.baseURL + `?key=${this.apiKey}`, {
      method: 'POST',
      headers: { type: 'application/json' },
      body: JSON.stringify({ action, version: this.version, params }),
    }).then((response) => response.json());
  }

  async isInstalled() {
    try {
      const res = await $fetch(this.baseURL);
      const text = await res.text();

      return text.includes('AnkiConnect');
    } catch {
      return false;
    }
  }

  requestPermission() {
    return this.ankiFetch<{
      permission: 'granted' | 'denied';
      requireApiKey: boolean;
      version: number;
    }>('requestPermission');
  }

  private async ensureDeck() {
    const decks = await this.ankiFetch<string[]>('deckNames');
    if (decks.error || !decks.result) {
      throw new Error(decks.error || 'Error: "ensureDeck"');
    }

    const deckExist = decks.result.some((deck) => deck === ANKI_DECK_NAME);
    if (deckExist) return;

    await this.ankiFetch('createDeck', { deck: ANKI_DECK_NAME });
  }

  async addNotes(notes: AnkiAddNoteParam[] | AnkiAddNoteParam) {
    const notesArr = Array.isArray(notes) ? notes : [notes];
    const notesPayload = notesArr.map(
      ({ expression, meaning, reading, notes, tags }) => ({
        modelName: 'Japanese KIC',
        deckName: ANKI_DECK_NAME,
        fields: {
          Notes: notes,
          Meaning: meaning,
          Reading: reading,
          Expression: expression,
        },
        tags: tags ? tags.split(',') : [],
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
          duplicateScopeOptions: {
            deckName: ANKI_DECK_NAME,
            checkChildren: false,
            checkAllModels: false,
          },
        },
      }),
    );

    await this.ensureDeck();

    const result = await this.ankiFetch<(number | null)[]>('addNotes', {
      notes: notesPayload,
    });

    return result;
  }

  deleteNotes(ids: number[]) {
    return this.ankiFetch<null>('deleteNotes', { notes: ids });
  }
}

export default AnkiApi;
