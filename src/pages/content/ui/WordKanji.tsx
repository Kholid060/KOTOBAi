import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import { memo, useEffect, useRef, useState } from 'react';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { UiButton } from '@root/src/components/ui/button';
import { BookmarkIcon } from 'lucide-react';
import { isKanji } from 'wanakana';

function WordKanji({
  result,
  className,
  onToggleDisable,
  ...props
}: {
  result: SearchDictWordResult;
  onToggleDisable?: (disable: boolean) => void;
} & React.DetailsHTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [kanjiList, setKanjiList] = useState<DictKanjiEntry[]>([]);

  useEffect(() => {
    const [firstEntry] = result.entries;
    const currKanji = firstEntry?.kanji?.find(
      (kanji) => kanji === firstEntry.word,
    );
    if (!currKanji) {
      setKanjiList([]);
      return;
    }

    const kanji = currKanji.split('').reduce<number[]>((acc, char) => {
      if (!isKanji(char)) return acc;

      acc.push(char.codePointAt(0));

      return acc;
    }, []);
    RuntimeMessage.sendMessage('background:search-kanji', {
      by: 'id',
      input: kanji,
      maxResult: 10,
    })
      .then((kanjiResult) => {
        setKanjiList(kanjiResult.filter(Boolean));
      })
      .catch((error) => {
        console.error(error);
        setKanjiList([]);
      });
  }, [result.entries]);
  useEffect(() => {
    onToggleDisable?.(kanjiList.length <= 0);
  }, [onToggleDisable, kanjiList]);

  if (kanjiList.length <= 0) return null;

  return (
    <div
      className={cn('pb-4 border-t px-4 space-y-4 divide-y', className)}
      ref={containerRef}
      id="kanji-section"
      {...props}
    >
      {kanjiList.map((kanji) => (
        <div key={kanji.id} className="pt-4">
          <div className="flex items-center gap-2">
            <p className="text-6xl text-indigo-400 font-sans-jp">
              {String.fromCodePoint(kanji.id)}
            </p>
            <div className="flex-grow">
              <div className="text-xs grid grid-cols-2 gap-1 ml-1">
                <div
                  title={`${
                    kanji.misc.freq ?? '-'
                  } of 2501 moust used kanji in newspaper`}
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
              <UiButton
                className="ml-1 flex-shrink-0"
                size="icon-xs"
                variant="secondary"
              >
                <BookmarkIcon className="h-4 w-4" />
              </UiButton>
            </div>
          </div>
          <div className="mt-2">
            <p>{kanji.meanings.join(', ')}</p>
            <table className="text-left mt-2">
              <tr>
                <th className="font-normal align-baseline">Kun:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {kanji.reading.ja_kun?.join('、')}
                </td>
              </tr>
              <tr>
                <th className="font-normal align-baseline">On:</th>
                <td className="font-sans-jp pl-1 leading-tight">
                  {kanji.reading.ja_on?.join('、')}
                </td>
              </tr>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(WordKanji);
