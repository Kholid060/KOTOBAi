import UiCommand from '@root/src/components/ui/command';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useUpdateEffect } from 'usehooks-ts';
import CommandWordDetail from './CommandWordDetail';
import CommandNameDetail from './CommandNameDetail';
import CommandKanjiDetail from './CommandKanjiDetail';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { DictQueryResult } from '@root/src/utils/searchDictEntries';
import SharedDictSearchList from '@root/src/components/shared/SharedDictSearchList';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';

type ItemType = 'words' | 'kanji' | 'names';
type DictAllEntry =
  | DictKanjiEntry
  | DictionaryNameEntryResult
  | DictionaryWordEntryResult;
interface ActiveItem {
  id: string;
  type: ItemType;
}

export interface CommandContentRef {
  activeItem: ActiveItem;
  activeItemDetail: DictAllEntry | null;
  setActiveItem: React.Dispatch<React.SetStateAction<ActiveItem>>;
}

type DetailComp = React.FC<{
  onClose?(): void;
  onBookmark?(): void;
  entry: DictAllEntry;
}>;

const itemDetailsMap: Record<ItemType, DetailComp> = {
  names: CommandNameDetail as DetailComp,
  words: CommandWordDetail as DetailComp,
  kanji: CommandKanjiDetail as DetailComp,
};

const CommandContent = forwardRef<
  CommandContentRef,
  {
    query: string;
    children?: React.ReactNode;
    queryResult: DictQueryResult;
  }
>(({ query, queryResult, children }, ref) => {
  const [activeItem, setActiveItem] = useState<ActiveItem>({
    id: '',
    type: 'words',
  });

  const hasResult = Object.values(queryResult).some(
    (entries) => entries.length > 0,
  );

  const activeItemDetail =
    activeItem.id &&
    queryResult[activeItem.type].find((item) => item.id === +activeItem.id);
  const ActiveItemDetail = itemDetailsMap[activeItem.type];

  useImperativeHandle(
    ref,
    () => ({
      activeItem,
      setActiveItem,
      activeItemDetail: activeItemDetail || null,
    }),
    [activeItem, activeItemDetail],
  );

  useUpdateEffect(() => {
    if (!hasResult) setActiveItem({ id: '', type: 'words' });
  }, [hasResult]);

  return (
    <div className="flex">
      <UiCommand.List
        className="max-h-[500px] flex-grow"
        style={{
          height: 'var(--cmdk-list-height)',
          transition: 'height 250ms ease',
        }}
      >
        {children}
        {!query.trim() && !hasResult && (
          <div className="px-4 py-8 text-sm text-muted-foreground w-full mx-auto max-w-md">
            Search options
            <ul className="mt-3 list-disc pl-4 space-y-2">
              <li>
                Append <kbd className="kbd">{'>'}</kbd> to only search kanji
              </li>
              <li>
                Append <kbd className="kbd">{'#'}</kbd> to only search words
              </li>
              <li>
                Append <kbd className="kbd">{'@'}</kbd> to only search names
              </li>
            </ul>
          </div>
        )}
        <SharedDictSearchList
          query={query}
          result={queryResult}
          onSelect={(item) => {
            RuntimeMessage.sendMessage(
              'background:dashboard-open',
              `/${item.type}/${item.id}`,
            );
            // setActiveItem(item);
          }}
        />
      </UiCommand.List>
      {activeItemDetail && (
        <div className="border-l flex-shrink-0 text-sm w-96 max-h-[500px] overflow-auto">
          <ActiveItemDetail
            entry={activeItemDetail}
            onClose={() => setActiveItem({ id: '', type: 'words' })}
          />
        </div>
      )}
    </div>
  );
});
CommandContent.displayName = 'CommandContent';

export default CommandContent;
