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
import { DictKanjiEntry } from '@root/src/interface/dict.interface';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';

interface SharedDictSearchListProp {
  query: string;
  result: DictQueryResult | null;
  onSelect?: (item: {
    id: string;
    type: 'words' | 'kanji' | 'names';
    word?: string;
    entry?:
      | DictionaryWordEntryResult
      | DictKanjiEntry
      | DictionaryNameEntryResult;
  }) => void;
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

  useUpdateEffect(() => {
    setActiveTab('all');
  }, [query]);

  if (!result) return null;

  const hasResult =
    result && Object.values(result).some((entries) => entries.length > 0);
  const showTab = hasResult && getDictQueryType(query) === 'all';
  const filteredTabs = showTab
    ? tabs.filter((tab) => tab.id === 'all' || result[tab.id].length > 0)
    : [];

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
          onSelect={(id, entry, word) => {
            onSelect?.({ id, entry, word, type: 'words' });
          }}
        />
      )}
      {(activeTab === 'all' || activeTab === 'kanji') && (
        <CommandKanjiEntries
          query={query}
          entries={result.kanji}
          onSelect={(id, entry) => onSelect?.({ id, entry, type: 'kanji' })}
        />
      )}
      {(activeTab === 'all' || activeTab === 'names') && (
        <CommandNameEntries
          query={query}
          entries={result.names}
          onSelect={(id, entry) => onSelect?.({ id, entry, type: 'names' })}
        />
      )}
    </>
  );
}

export default SharedDictSearchList;
