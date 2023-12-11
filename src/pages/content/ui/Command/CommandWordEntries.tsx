import UiCommand from '@root/src/components/ui/command';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';

function CommandWordEntries({
  entries,
  onSelect,
}: {
  query: string;
  onSelect?: (id: string) => void;
  entries: DictionaryWordEntryResult[];
}) {
  if (entries.length <= 0) return null;

  return (
    <UiCommand.Group heading="Words">
      {entries.map((entry) => (
        <UiCommand.Item
          key={entry.id}
          onSelect={onSelect}
          className="block !py-2"
          value={entry.id.toString()}
        >
          <ViewReadingKanji entry={entry} className="text-sm" />
          <p className="leading-tight line-clamp-2">
            {entry.sense
              .slice(0, 3)
              .map((sense) => sense.gloss.join(', '))
              .join(', ')}
          </p>
        </UiCommand.Item>
      ))}
    </UiCommand.Group>
  );
}

export default CommandWordEntries;
