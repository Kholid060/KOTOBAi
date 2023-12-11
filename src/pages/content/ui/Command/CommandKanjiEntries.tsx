import UiCommand from '@root/src/components/ui/command';
import { DictKanjiEntry } from '@root/src/interface/dict.interface';

function CommandKanjiEntries({
  entries,
  onSelect,
}: {
  query: string;
  entries: DictKanjiEntry[];
  onSelect?: (id: string) => void;
}) {
  if (entries.length <= 0) return null;

  return (
    <UiCommand.Group heading="Kanji">
      {entries.map((entry) => (
        <UiCommand.Item
          key={entry.id}
          className="block !py-2"
          onSelect={onSelect}
          value={entry.id.toString()}
        >
          <p className="dark:text-indigo-400 text-indigo-600 font-sans-jp font-semibold">
            {String.fromCodePoint(entry.id)}
          </p>
          <p className="leading-tight line-clamp-2">
            {entry.meanings.join(', ')}
          </p>
        </UiCommand.Item>
      ))}
    </UiCommand.Group>
  );
}

export default CommandKanjiEntries;
