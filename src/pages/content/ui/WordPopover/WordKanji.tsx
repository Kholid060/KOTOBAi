import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { memo } from 'react';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import SharedBookmarkBtnContent from '@root/src/components/shared/SharedBookmarkBtn/Content';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';

function WordKanji({
  entries,
  className,
  ...props
}: {
  entries: DictKanjiEntry[];
} & React.DetailsHTMLAttributes<HTMLDivElement>) {
  if (entries.length <= 0) return null;

  return (
    <div
      className={cn('pb-4 px-4 space-y-4 divide-y', className)}
      id="kanji-section"
      {...props}
    >
      {entries.map((kanji) => (
        <div key={kanji.id} className="pt-4">
          <div className="flex items-center gap-2">
            <p className="text-6xl dark:text-indigo-400 text-indigo-600 font-sans-jp">
              {String.fromCodePoint(kanji.id)}
            </p>
            <div className="flex-grow">
              <div className="text-xs grid grid-cols-2 gap-1 ml-1">
                <div
                  title={`${
                    kanji.misc.freq ?? '-'
                  } of 2501 most used kanji in newspaper`}
                >
                  <p className="text-xs text-muted-foreground">Freq:</p>
                  {kanji.misc.freq ?? '-'}/2501
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stroke:</p>
                  {kanji.misc.stroke_count
                    ? `${kanji.misc.stroke_count} strokes`
                    : '-'}
                </div>
                <div title="Japanese Language Proficiency Test (JLPT) Level">
                  <p className="text-xs text-muted-foreground">JLPT:</p>
                  {kanji.misc.jlpt ?? '-'}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade:</p>
                  {kanji.misc.grade ? `${kanji.misc.grade} grade` : '-'}
                </div>
              </div>
            </div>
            <div className="self-start">
              <SharedBookmarkBtnContent
                entry={{
                  id: kanji.id,
                  reading: [],
                  meaning: kanji.meanings,
                  type: DICTIONARY_NAME.KANJIDIC,
                  kanji: [String.fromCodePoint(kanji.id)],
                }}
              />
            </div>
          </div>
          <div className="mt-2">
            <p>{kanji.meanings.join(', ')}</p>
            <table className="text-left mt-2">
              <tbody>
                {kanji.reading.ja_kun && (
                  <tr>
                    <th className="font-normal align-baseline">Kun:</th>
                    <td className="font-sans-jp pl-1 leading-tight">
                      {kanji.reading.ja_kun.join('、')}
                    </td>
                  </tr>
                )}
                {kanji.reading.ja_on && (
                  <tr>
                    <th className="font-normal align-baseline">On:</th>
                    <td className="font-sans-jp pl-1 leading-tight">
                      {kanji.reading.ja_on.join('、') || '-'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-right mt-1">
            <button
              className="underline text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                RuntimeMessage.sendMessage(
                  'background:dashboard-open',
                  `/kanji/${kanji.id}`,
                );
              }}
            >
              <span>See detail</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(WordKanji);
