import { memo } from 'react';
import { SearchDictWordResult } from '../../background/messageHandler/dictWordSearcher';

interface WordContentProps {
  result: SearchDictWordResult;
}

function WordContent({ result }: WordContentProps) {
  return (
    <>
      <p>{result.input}</p>
      {result.entries.map((entry) => (
        <div key={entry.id} className="mb-4 border-b">
          <p>{entry.word}</p>
          <p>KANJI: {entry.kanji?.join(', ')}</p>
          <p>READING: {entry.reading?.join(', ')}</p>
          <p>
            Sense:{' '}
            {entry.sense?.map((sense) => sense.gloss.join(';')).join(', ')}
          </p>
        </div>
      ))}
    </>
  );
}

export default memo(WordContent);
