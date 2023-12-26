import ViewKanjiStrokes from '@root/src/components/view/ViewKanjiStrokes';
import SharedBookmarkBtnMain from '@root/src/components/shared/SharedBookmarkBtn/Main';
import {
  DictKanjiEntry,
  DictKanjiVGEntry,
  DictWordEntry,
} from '@root/src/interface/dict.interface';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { KANJI_DICT_INDICES } from '@root/src/shared/constant/word.const';
import dictDB from '@root/src/shared/db/dict.db';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import wordEntriesSorter from '@root/src/utils/wordEntriesSorter';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { Volume2Icon } from 'lucide-react';

function KanjiDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams();
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  const { dictEntry } = location.state ?? {};

  const [strokes, setStrokes] = useState<DictKanjiVGEntry | null>(null);
  const [exampleWords, setExampleWords] = useState<DictWordEntry[]>([]);
  const [kanjiDetail, setKanjiDetail] = useState<DictKanjiEntry | null>(null);

  useEffect(() => {
    const kanjiId = +entryId!;
    const fetchAdditionalInfo = () => {
      const kanjiChar = String.fromCodePoint(kanjiId);

      dictDB.kanjivg.get(kanjiId).then((result) => setStrokes(result ?? null));
      dictDB.words
        .where('kToken')
        .equals(kanjiChar)
        .or('kanji')
        .startsWith(kanjiChar)
        .limit(50)
        .toArray()
        .then((words) => {
          const mappedWords = wordEntriesSorter(words)
            .slice(0, 10)
            .map((word) => {
              let kanji = word.kanji;
              if (kanji) {
                const currKanji = kanji.find((item) =>
                  item.includes(kanjiChar),
                );
                kanji = currKanji ? [currKanji] : kanji;
              }

              return {
                ...word,
                kanji,
                reading: [word.reading[0]],
              };
            });

          setExampleWords(mappedWords);
        });
    };

    if (dictEntry) {
      setKanjiDetail(dictEntry);
      fetchAdditionalInfo();
    } else {
      dictDB.kanji.get(kanjiId).then((result) => {
        if (!result) {
          navigate('/');
          return;
        }

        setKanjiDetail(result);
        fetchAdditionalInfo();
      });
    }

    return () => {
      setStrokes(null);
      setExampleWords([]);
      setKanjiDetail(null);
    };
  }, [dictEntry, entryId, navigate]);

  if (!kanjiDetail) return null;

  const kanji = String.fromCodePoint(kanjiDetail.id);
  const indices = Object.entries(kanjiDetail.dicts ?? []);

  return (
    <>
      <div className="flex items-center mt-2">
        <p className="text-8xl leading-tight dark:text-indigo-400 text-indigo-600 font-sans-jp">
          {kanji}
        </p>
        <div className="flex-grow ml-8">
          <div className="grid grid-cols-2 gap-4 ml-1 max-w-[250px]">
            <div
              title={`${
                kanjiDetail.misc.freq ?? '-'
              } of 2501 moust used kanji in newspaper`}
            >
              <p className="text-muted-foreground leading-tight">Freq:</p>
              {kanjiDetail.misc.freq ?? '-'}/2501
            </div>
            <div>
              <p className="text-muted-foreground leading-tight">Stroke:</p>
              {kanjiDetail.misc.stroke_count
                ? `${kanjiDetail.misc.stroke_count} strokes`
                : '-'}
            </div>
            <div title="Japanese Language Proficiency Test (JLPT) Level">
              <p className="text-muted-foreground leading-tight">JLPT:</p>
              {kanjiDetail.misc.jlpt ?? '-'}
            </div>
            <div>
              <p className="text-muted-foreground leading-tight">Grade:</p>
              {kanjiDetail.misc.grade ? `${kanjiDetail.misc.grade} grade` : '-'}
            </div>
          </div>
        </div>
        <div className="self-start">
          <SharedBookmarkBtnMain
            entry={{
              reading: [],
              id: kanjiDetail.id,
              kanji: [kanji],
              meaning: kanjiDetail.meanings,
              type: DICTIONARY_NAME.KANJIDIC,
            }}
          />
        </div>
      </div>
      <div className="mt-6">
        <p>{kanjiDetail.meanings.join(', ')}</p>
        <table className="text-left mt-2">
          <tbody>
            {kanjiDetail.reading.ja_kun && (
              <tr>
                <th className="font-normal align-baseline">Kun:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {kanjiDetail.reading.ja_kun.join('、')}
                </td>
              </tr>
            )}
            {kanjiDetail.reading.ja_on && (
              <tr>
                <th className="font-normal align-baseline">On:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {kanjiDetail.reading.ja_on.join('、') || '-'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {strokes && (
        <div className="mt-6">
          <p className="font-semibold mb-2">Stroke Order</p>
          <ViewKanjiStrokes height={100} width={100} entry={strokes} />
        </div>
      )}
      {exampleWords.length > 0 && (
        <div className="mt-6">
          <p className="font-semibold mb-2">Example Words</p>
          <ul className="space-y-1 list-disc pl-4">
            {exampleWords.map((wordEntry) => (
              <li key={wordEntry.id}>
                <Link to={`/words/${wordEntry.id}`}>
                  {wordEntry.kanji && (
                    <span className="dark:text-indigo-400 text-indigo-600">
                      {wordEntry.kanji[0]}
                    </span>
                  )}
                  <span className="dark:text-emerald-400 text-emerald-700">
                    【{wordEntry.reading[0]}】
                  </span>
                </Link>
                {isSpeechAvailable && (
                  <button
                    className="text-muted-foreground mr-2 -ml-1 align-text-top"
                    onClick={() => speak(wordEntry.reading[0])}
                  >
                    <Volume2Icon className="h-4 w-4" />
                  </button>
                )}
                <span className="text-muted-foreground">
                  {wordEntry.sense
                    .slice(0, 3)
                    .map((sense) => sense.gloss.join(', '))
                    .join('; ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {indices.length > 0 && (
        <details className="mt-6">
          <summary>Dictionary Indices</summary>
          <table>
            <tbody>
              {indices.map(([name, value]) => (
                <tr key={name} className="rounded-t-md">
                  <td className="border p-1">{value}</td>
                  <td className="border p-1">{KANJI_DICT_INDICES[name]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}

export default KanjiDetailPage;
