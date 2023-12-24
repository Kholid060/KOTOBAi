import UiCommand from '@root/src/components/ui/command';
import ViewReadingKanji from '@root/src/components/view/ViewReadingKanji';
import { DictionaryWordEntryResult } from '@root/src/pages/background/messageHandler/dictWordSearcher';
import { useRef } from 'react';

function CommandWordEntries({
  entries,
  onSelect,
}: {
  query: string;
  entries: DictionaryWordEntryResult[];
  onSelect?: (
    id: string,
    entry?: DictionaryWordEntryResult,
    word?: string,
  ) => void;
}) {
  const matchWord = useRef<Record<number, string>>({});

  if (entries.length <= 0) return null;

  return (
    <UiCommand.Group heading="Words">
      {entries.map((entry) => (
        <UiCommand.Item
          key={entry.id}
          className="block !py-2"
          value={entry.id.toString()}
          onSelect={(id) => onSelect(id, entry, matchWord.current[entry.id])}
        >
          <ViewReadingKanji
            entry={entry}
            className="text-sm"
            onMatchWord={(match) => (matchWord.current[entry.id] = match)}
          />
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
