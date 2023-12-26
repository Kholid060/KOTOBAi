import UiCommand from '@root/src/components/ui/command';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DictionaryNameEntryResult } from '@root/src/pages/background/messageHandler/dictNameSearcher';

function CommandNameEntries({
  entries,
  onSelect,
}: {
  query: string;
  entries: DictionaryNameEntryResult[];
  onSelect?: (id: string, entry?: DictionaryNameEntryResult) => void;
}) {
  if (entries.length <= 0) return null;

  return (
    <UiCommand.Group heading="Names">
      {entries.map((entry) => (
        <UiCommand.Item
          key={entry.id}
          className="block !py-2"
          value={entry.id.toString()}
          onSelect={(id) => onSelect?.(id, entry)}
        >
          <ViewReadingKanji entry={entry} />
          <p className="line-clamp-2">{entry.tr.detail.join(', ')}</p>
        </UiCommand.Item>
      ))}
    </UiCommand.Group>
  );
}

export default CommandNameEntries;
