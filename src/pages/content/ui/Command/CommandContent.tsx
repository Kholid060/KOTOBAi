import UiCommand from '@root/src/components/ui/command';
import UiToggleGroup from '@root/src/components/ui/toggle-group';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useUpdateEffect } from 'usehooks-ts';
import CommandKanjiEntries from './CommandKanjiEntries';
import CommandNameEntries from './CommandNameEntries';
import CommandWordEntries from './CommandWordEntries';
import {
  CommandTabIds,
  CommandQueryResult,
  getCommandQueryType,
} from './CommandContainer';
import CommandWordDetail from './CommandWordDetail';
import CommandNameDetail from './CommandNameDetail';
import CommandKanjiDetail from './CommandKanjiDetail';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';

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

const tabs: Array<{ name: string; id: CommandTabIds }> = [
  { name: 'All', id: 'all' },
  { name: 'Words', id: 'words' },
  { name: 'Kanji', id: 'kanji' },
  { name: 'Names', id: 'names' },
];
const itemDetailsMap: Record<
  ItemType,
  React.FC<{
    onClose?(): void;
    onBookmark?(): void;
    entry: DictAllEntry;
  }>
> = {
  names: CommandNameDetail,
  words: CommandWordDetail,
  kanji: CommandKanjiDetail,
};

const CommandContent = forwardRef<
  CommandContentRef,
  {
    query: string;
    children?: React.ReactNode;
    queryResult: CommandQueryResult;
  }
>(({ query, queryResult, children }, ref) => {
  const [activeItem, setActiveItem] = useState<ActiveItem>({
    id: '',
    type: 'words',
  });
  const [activeTab, setActiveTab] = useState<CommandTabIds>('all');

  const hasResult = Object.values(queryResult).some(
    (entries) => entries.length > 0,
  );
  const showTab = hasResult && getCommandQueryType(query) === 'all';

  const activeItemDetail =
    activeItem.id &&
    queryResult[activeItem.type].find((item) => item.id === +activeItem.id);
  const ActiveItemDetail = itemDetailsMap[activeItem.type];

  useImperativeHandle(
    ref,
    () => ({
      activeItem,
      setActiveItem,
      activeItemDetail,
    }),
    [activeItem, activeItemDetail],
  );

  useUpdateEffect(() => {
    setActiveTab('all');
  }, [query]);
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
        {showTab && (
          <div className="px-4 pt-2 pb-1 flex gap-2 items-center">
            <UiToggleGroup
              value={activeTab}
              type="single"
              onValueChange={(val) => setActiveTab(val as CommandTabIds)}
            >
              {tabs
                .filter(
                  (tab) => tab.id === 'all' || queryResult[tab.id].length > 0,
                )
                .map((type) => (
                  <UiToggleGroup.Item
                    size="xs"
                    key={type.id}
                    value={type.id}
                    className="text-sm"
                  >
                    {type.name}
                  </UiToggleGroup.Item>
                ))}
            </UiToggleGroup>
          </div>
        )}
        {(activeTab === 'all' || activeTab === 'words') && (
          <CommandWordEntries
            query={query}
            entries={queryResult.words}
            onSelect={(id) => setActiveItem({ id, type: 'words' })}
          />
        )}
        {(activeTab === 'all' || activeTab === 'kanji') && (
          <CommandKanjiEntries
            query={query}
            entries={queryResult.kanji}
            onSelect={(id) => setActiveItem({ id, type: 'kanji' })}
          />
        )}
        {(activeTab === 'all' || activeTab === 'names') && (
          <CommandNameEntries
            query={query}
            entries={queryResult.names}
            onSelect={(id) => setActiveItem({ id, type: 'names' })}
          />
        )}
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
