import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import ViewKanjiStrokes from '@root/src/components/view/ViewKanjiStrokes';
import {
  DictKanjiEntry,
  DictKanjiVGEntry,
} from '@root/src/interface/dict.interface';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import { KANJI_DICT_INDICES } from '@root/src/shared/constant/word.const';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function KanjiStrokes({ entry }: { entry: DictKanjiEntry }) {
  const kanjiVgCacheRef = useRef<Record<number, DictKanjiVGEntry>>({});

  const [strokes, setStrokes] = useState<DictKanjiVGEntry | null>(null);

  useEffect(() => {
    const cache = kanjiVgCacheRef.current[entry.id];
    if (cache) {
      setStrokes(cache);
    } else {
      RuntimeMessage.sendMessage('background:search-kanjivg', {
        input: entry.id,
      }).then(([kanjiStroke]) => {
        setStrokes(kanjiStroke);
        kanjiVgCacheRef.current[entry.id] = kanjiStroke;
      });
    }

    return () => {
      kanjiVgCacheRef.current = {};
    };
  }, [entry]);

  if (!strokes) return;

  return (
    <div className="mt-6">
      <ViewKanjiStrokes entry={strokes} />
    </div>
  );
}

function CommandKanjiDetail({
  entry,
  onClose,
}: {
  onClose?(): void;
  onBookmark?(): void;
  entry: DictKanjiEntry;
}) {
  const indices = Object.entries(entry.dicts ?? []);

  return (
    <div className="px-4 py-2">
      <button
        onClick={() => onClose?.()}
        className="flex text-muted-foreground items-center"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="ml-1">kanji</span>
      </button>
      <div className="flex items-center gap-2 mt-2">
        <p className="text-6xl dark:text-indigo-400 text-indigo-600 font-sans-jp">
          {String.fromCodePoint(entry.id)}
        </p>
        <div className="flex-grow">
          <div className="text-xs grid grid-cols-2 gap-1 ml-1">
            <div
              title={`${
                entry.misc.freq ?? '-'
              } of 2501 moust used kanji in newspaper`}
            >
              <p className="text-xs text-muted-foreground">Freq:</p>
              {entry.misc.freq ?? '-'}/2501
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stroke:</p>
              {entry.misc.stroke_count
                ? `${entry.misc.stroke_count} strokes`
                : '-'}
            </div>
            <div title="Japanese Language Proficiency Test (JLPT) Level">
              <p className="text-xs text-muted-foreground">JLPT:</p>
              {entry.misc.jlpt ?? '-'}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grade:</p>
              {entry.misc.grade ? `${entry.misc.grade} grade` : '-'}
            </div>
          </div>
        </div>
        <div className="self-start">
          <SharedBookmarkBtnContent
            entry={{ id: entry.id, type: DICTIONARY_NAME.KANJIDIC }}
          />
        </div>
      </div>
      <div className="mt-2">
        <p>{entry.meanings.join(', ')}</p>
        <table className="text-left mt-2">
          <tbody>
            {entry.reading.ja_kun && (
              <tr>
                <th className="font-normal align-baseline">Kun:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {entry.reading.ja_kun.join('、')}
                </td>
              </tr>
            )}
            {entry.reading.ja_on && (
              <tr>
                <th className="font-normal align-baseline">On:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {entry.reading.ja_on.join('、') || '-'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <KanjiStrokes entry={entry} />
      {indices.length > 0 && (
        <details className="mt-4">
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
    </div>
  );
}

export default CommandKanjiDetail;
