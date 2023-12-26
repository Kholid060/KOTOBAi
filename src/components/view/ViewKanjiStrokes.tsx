import {
  DictKanjiVGEntry,
  DictKanjiVGEntryPath,
} from '@root/src/interface/dict.interface';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { memo, useMemo } from 'react';

const DOT_POS_REGEX = /M([\d.]+),([\d.]+)C/i;

function traversePaths(
  paths: DictKanjiVGEntry['paths'],
  onPath: (path: DictKanjiVGEntryPath) => void,
) {
  paths.forEach((path) => {
    if ('d' in path) {
      onPath(path);
      return;
    }

    traversePaths(path.paths, onPath);
  });
}

const ViewKanjiStrokes = memo(
  ({
    entry,
    className,
    width = 80,
    height = 80,
    showCharAtFirst: showChatAtFirst,
    ...props
  }: {
    width?: number;
    height?: number;
    entry: DictKanjiVGEntry;
    showCharAtFirst?: boolean;
  } & React.DetailsHTMLAttributes<HTMLDivElement>) => {
    const paths = useMemo(() => {
      const kanjiPaths: {
        paths: DictKanjiVGEntryPath[];
        dotPos?: { x: string; y: string };
      }[] = [];
      traversePaths(entry.paths, (path) => {
        const lastPath = kanjiPaths.at(-1);
        const { 1: x, 2: y } = DOT_POS_REGEX.exec(path.d) ?? [];

        kanjiPaths.push({
          dotPos: x && y ? { x, y } : undefined,
          paths: [...(lastPath?.paths ?? []), path],
        });
      });

      if (showChatAtFirst && kanjiPaths.length > 0) {
        kanjiPaths.unshift({
          ...(kanjiPaths.at(-1) ?? { paths: [] }),
          dotPos: undefined,
        });
      }

      return kanjiPaths;
    }, [entry, showChatAtFirst]);

    return (
      <div className={cn('w-full overflow-x-auto', className)} {...props}>
        <div
          style={{ width: width * paths.length }}
          className="flex divide-x-2 border-2 border-t border-b rounded-md"
        >
          {paths.map((path, svgIndex) => (
            <svg
              key={svgIndex}
              xmlns="http://www.w3.org/2000/svg"
              width={width}
              height={height}
              className="flex-shrink-0"
              viewBox="0 0 109 109"
              style={{
                fill: 'none',
                strokeWidth: 3,
                stroke: 'currentcolor',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            >
              <line
                className="text-border"
                strokeDasharray="8"
                x1="0"
                x2="109"
                y1="54.5"
                y2="54.5"
              />
              <line
                className="text-border"
                strokeDasharray="8"
                x1="54.5"
                x2="54.5"
                y1="0"
                y2="109"
              />
              {path.paths.map((subPath, index) => (
                <path
                  key={subPath.id + index}
                  d={subPath.d}
                  className={
                    (showChatAtFirst && svgIndex === 0) ||
                    index === path.paths.length - 1
                      ? ''
                      : 'dark:text-muted-foreground text-zinc-400'
                  }
                ></path>
              ))}
              {path.dotPos && (
                <circle
                  cx={path.dotPos.x}
                  cy={path.dotPos.y}
                  r="3"
                  fill="currentcolor"
                  className="text-red-500/80"
                />
              )}
            </svg>
          ))}
        </div>
      </div>
    );
  },
);
ViewKanjiStrokes.displayName = 'ViewKanjiStrokes';

export default ViewKanjiStrokes;
