import { DictWordEntrySense } from '@root/src/interface/dict.interface';
import { WORD_POS_TAG } from '@root/src/shared/constant/word.const';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { Volume2Icon } from 'lucide-react';

function ViewWordSense({
  sense,
  tooltipExample,
  className,
  ...props
}: {
  tooltipExample?: boolean;
  sense: DictWordEntrySense[];
} & React.HTMLAttributes<HTMLUListElement>) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  return (
    <ul className={cn('list-decimal pl-4', className)} {...props}>
      {sense.map((sense, idx) => (
        <li key={idx}>
          <span className="inline space-x-0.5">
            {sense.pos.map((pos) => (
              <span
                key={pos}
                title={WORD_POS_TAG[pos].value}
                className="text-xs px-1 py-0.5 bg-fuchsia-400/20 dark:text-fuchsia-400 text-fuchsia-700 rounded inline-block"
              >
                {WORD_POS_TAG[pos].name || pos}
              </span>
            ))}
          </span>
          <p className="leading-tight inline"> {sense.gloss.join('; ')} </p>
          {sense.example &&
            (tooltipExample ? (
              <div className="mt-px">
                <div className="text-muted-foreground inline-block text-xs border px-1 py-0.5 rounded underline has-tooltip">
                  <span className="tooltip leading-tight rounded-md text-left shadow-lg p-1 text-sm bg-popover mt-5 border px-2 py-1">
                    <p className="font-sans-jp">
                      {sense.example.sent[0]?.text}
                    </p>
                    <p className="mt-1">{sense.example.sent[1]?.text}</p>
                  </span>
                  See example
                </div>
              </div>
            ) : (
              <div className="mt-px text-muted-foreground">
                <p className="font-sans-jp">
                  {sense.example.sent[0]?.text}
                  {isSpeechAvailable && (
                    <Volume2Icon
                      className="h-4 w-4 cursor-pointer  inline-block"
                      onClick={() => speak(sense.example.sent[0]?.text)}
                    />
                  )}
                </p>
                <p className="leading-tight">{sense.example.sent[1]?.text}</p>
              </div>
            ))}
        </li>
      ))}
    </ul>
  );
}

export default ViewWordSense;
