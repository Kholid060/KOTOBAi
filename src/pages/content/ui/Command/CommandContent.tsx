import UiCommand from '@root/src/components/ui/command';
import UiToggleGroup from '@root/src/components/ui/toggle-group';
import { useState } from 'react';
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

const tabs: Array<{ name: string; id: CommandTabIds }> = [
  { name: 'All', id: 'all' },
  { name: 'Words', id: 'words' },
  { name: 'Kanji', id: 'kanji' },
  { name: 'Names', id: 'names' },
];
const itemDetailsMap: Record<
  ItemType,
  React.FC<{
    entry:
      | DictKanjiEntry
      | DictionaryNameEntryResult
      | DictionaryWordEntryResult;
    onClose?(): void;
  }>
> = {
  names: CommandNameDetail,
  words: CommandWordDetail,
  kanji: CommandKanjiDetail,
};

function CommandContent({
  query,
  queryResult,
}: {
  queryResult: CommandQueryResult;
  query: string;
}) {
  const [activeItem, setActiveItem] = useState<{
    id: string;
    type: ItemType;
  }>({
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
        {query && <UiCommand.Empty>No results found.</UiCommand.Empty>}
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
        <div className="w-96 border-l flex-shrink-0 text-sm">
          <ActiveItemDetail
            entry={activeItemDetail}
            onClose={() => setActiveItem({ id: '', type: 'words' })}
          />
        </div>
      )}
    </div>
  );
}

export default CommandContent;
