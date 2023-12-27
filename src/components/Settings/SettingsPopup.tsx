import { SettingsPageSectionProps } from '@root/src/pages/dashboard/routes/Settings';
import UiCard from '../ui/card';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import { Volume2Icon } from 'lucide-react';
import { UiButton } from '../ui/button';
import ViewReadingKanji from '../view/ViewReadingKanji';
import ViewWordEntry from '../view/ViewWordEntry';
import { DictWordEntry } from '@root/src/interface/dict.interface';
import { ExtensionSettingsPopup } from '@root/src/shared/storages/extSettingsStorage';
import UiSwitch from '../ui/switch';
import UiSelect from '../ui/select';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { EXT_POPUP_FONT_SIZE } from '@root/src/shared/constant/ext-settings.const';

const WORD_ENTRY_SAMPLE = {
  sense: [
    {
      pos: ['n', 'adv'],
      gloss: ['today', 'this day'],
      example: {
        sent: [
          {
            text: '今日は何をしたいですか。',
            lang: 'jpn',
          },
          {
            text: 'What would you like to do today?',
            lang: 'eng',
          },
        ],
        sourceId: 'tat:232046',
        text: '今日',
      },
    },
    {
      pos: ['n', 'adv'],
      gloss: ['these days', 'recently', 'nowadays'],
      example: {
        sent: [
          {
            text: '今日ますます多くの人が、都会より田舎の生活を好むようになっています。',
            lang: 'jpn',
          },
          {
            text: 'Nowadays more and more people prefer country life to city life.',
            lang: 'eng',
          },
        ],
        sourceId: 'tat:171479',
        text: '今日',
      },
    },
  ],
  reading: ['きょう', 'こんにち', 'こんち', 'こんじつ'],
  id: 1579110,
  kanji: ['今日'],
  common: true,
} as DictWordEntry;

function WordEntryViewSample({
  popupSettings,
}: {
  popupSettings: ExtensionSettingsPopup;
}) {
  const { isSpeechAvailable, speak } = useSpeechSynthesis();

  return (
    <div
      className={cn(
        'p-4 rounded-md border max-w-sm',
        EXT_POPUP_FONT_SIZE[popupSettings.fontSize].className,
      )}
    >
      <div className="flex items-start">
        <ViewReadingKanji
          entry={WORD_ENTRY_SAMPLE}
          className="text-lg leading-tight pt-0.5 flex-grow"
        />
        {isSpeechAvailable && (
          <UiButton
            variant="secondary"
            size="icon-xs"
            className="ml-1 flex-shrink-0"
            onClick={() => speak?.(WORD_ENTRY_SAMPLE.reading[0])}
          >
            <Volume2Icon className="h-4 w-4" />
          </UiButton>
        )}
      </div>
      <ViewWordEntry.Meta entry={WORD_ENTRY_SAMPLE} />
      {popupSettings.showDefinition && (
        <ViewWordEntry.Sense
          tooltipExample
          className="mt-2 space-y-1"
          showPOS={popupSettings.showPOS}
          sense={WORD_ENTRY_SAMPLE.sense}
        />
      )}
      <div className="text-right mt-1">
        <button className="underline text-xs text-muted-foreground hover:text-foreground">
          <span>See detail</span>
        </button>
      </div>
    </div>
  );
}

function SettingsPopup({
  settings,
  updateSettings,
  ...props
}: SettingsPageSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <UiCard {...props}>
      <UiCard.Header className="text-lg font-semibold">
        Popup Appearance
      </UiCard.Header>
      <UiCard.Content>
        <WordEntryViewSample popupSettings={settings.popup} />
        <ul className="mt-6 space-y-6">
          <li className="flex items-center gap-4">
            <UiSwitch
              checked={settings.popup.showDefinition}
              onCheckedChange={(value) =>
                updateSettings?.({ popup: { showDefinition: value } })
              }
            />
            <div className="flex-grow">
              <p className="font-medium">Show word definitions</p>
            </div>
          </li>
          {settings.popup.showDefinition && (
            <li className="flex items-center gap-4">
              <UiSwitch
                checked={settings.popup.showPOS}
                onCheckedChange={(value) =>
                  updateSettings?.({ popup: { showPOS: value } })
                }
              />
              <div className="flex-grow">
                <p className="font-medium">Show Part of Speech</p>
              </div>
            </li>
          )}
        </ul>
        <table className="mt-6">
          <tr>
            <td className="min-w-[150px]">
              <p className="font-medium">Font size</p>
            </td>
            <td>
              <UiSelect
                className="w-auto"
                value={settings.popup.fontSize}
                onValueChange={(value) =>
                  updateSettings?.({
                    popup: {
                      fontSize: value as ExtensionSettingsPopup['fontSize'],
                    },
                  })
                }
              >
                {Object.values(EXT_POPUP_FONT_SIZE).map((size) => (
                  <UiSelect.Option
                    key={size.id}
                    value={size.id}
                    className="capitalize"
                  >
                    {size.name}
                  </UiSelect.Option>
                ))}
              </UiSelect>
            </td>
          </tr>
        </table>
      </UiCard.Content>
    </UiCard>
  );
}

export default SettingsPopup;
