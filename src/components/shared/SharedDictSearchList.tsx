import CommandKanjiEntries from '@root/src/pages/content/ui/Command/CommandKanjiEntries';
import CommandNameEntries from '@root/src/pages/content/ui/Command/CommandNameEntries';
import CommandWordEntries from '@root/src/pages/content/ui/Command/CommandWordEntries';
import {
  DictQueryResult,
  DictQueryType,
  getDictQueryType,
} from '@root/src/utils/searchDictEntries';
import UiToggleGroup from '../ui/toggle-group';
import { useState } from 'react';
import { useUpdateEffect } from 'usehooks-ts';

interface SharedDictSearchListProp {
  query: string;
  result: DictQueryResult | null;
  onSelect?: (item: { type: 'words' | 'kanji' | 'names'; id: string }) => void;
}

const tabs: Array<{ name: string; id: DictQueryType }> = [
  { name: 'All', id: 'all' },
  { name: 'Words', id: 'words' },
  { name: 'Kanji', id: 'kanji' },
  { name: 'Names', id: 'names' },
];

function SharedDictSearchList({
  result,
  query,
  onSelect,
}: SharedDictSearchListProp) {
  const [activeTab, setActiveTab] = useState<DictQueryType>('all');

  const hasResult =
    result && Object.values(result).some((entries) => entries.length > 0);
  const showTab = hasResult && getDictQueryType(query) === 'all';
  const filteredTabs =
    showTab &&
    tabs.filter((tab) => tab.id === 'all' || result[tab.id].length > 0);

  useUpdateEffect(() => {
    setActiveTab('all');
  }, [query]);

  return (
    <>
      {showTab && filteredTabs.length > 2 && (
        <div className="px-4 pt-2 pb-1 flex gap-2 items-center">
          <UiToggleGroup
            value={activeTab}
            type="single"
            onValueChange={(val) => setActiveTab(val as DictQueryType)}
          >
            {filteredTabs.map((type) => (
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
          entries={result.words}
          onSelect={(id) => onSelect({ id, type: 'words' })}
        />
      )}
      {(activeTab === 'all' || activeTab === 'kanji') && (
        <CommandKanjiEntries
          query={query}
          entries={result.kanji}
          onSelect={(id) => onSelect({ id, type: 'kanji' })}
        />
      )}
      {(activeTab === 'all' || activeTab === 'names') && (
        <CommandNameEntries
          query={query}
          entries={result.names}
          onSelect={(id) => onSelect({ id, type: 'names' })}
        />
      )}
    </>
  );
}

export default SharedDictSearchList;
