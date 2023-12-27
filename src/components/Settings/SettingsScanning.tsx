import { SettingsPageSectionProps } from '@root/src/pages/dashboard/routes/Settings';
import UiCard from '../ui/card';
import UiSwitch from '../ui/switch';
import UiSelect from '../ui/select';
import { EXT_SCAN_KEY_MOD } from '@root/src/shared/constant/ext-settings.const';
import { ExtensionSettingsScanning } from '@root/src/shared/storages/extSettingsStorage';

function SettingsScanning({
  settings,
  updateSettings,
  ...props
}: SettingsPageSectionProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <UiCard {...props}>
      <UiCard.Header className="text-lg font-semibold">
        Text Scanning
      </UiCard.Header>
      <UiCard.Content>
        <ul className="space-y-6">
          <li className="flex items-center gap-4">
            <UiSwitch
              checked={settings.scanning.highlightText}
              onCheckedChange={(value) =>
                updateSettings?.({ scanning: { highlightText: value } })
              }
            />
            <div className="flex-grow">
              <p className="font-medium">Text highlighter</p>
              <p className="text-sm text-muted-foreground">
                Highlight the text when the definition is found
              </p>
            </div>
          </li>
          {settings.scanning.highlightText && (
            <li className="flex items-center gap-4">
              <UiSwitch
                checked={settings.scanning.highlightTextBox}
                onCheckedChange={(value) =>
                  updateSettings?.({ scanning: { highlightTextBox: value } })
                }
              />
              <div className="flex-grow">
                <p className="font-medium">Highlight the Text Boxes text</p>
                <p className="text-sm text-muted-foreground">
                  Highlight text inside of the Text Boxes
                </p>
              </div>
            </li>
          )}
        </ul>
        <table className="mt-6">
          <tr>
            <td className="min-w-[150px]">
              <p className="font-medium">Scan modifier key</p>
              <p className="text-sm text-muted-foreground">
                Hold a key while moving the cursor to show the popup
              </p>
            </td>
            <td className="pl-8">
              <UiSelect
                className="w-auto"
                value={settings.scanning.modifier}
                onValueChange={(value) =>
                  updateSettings?.({
                    scanning: {
                      modifier: value as ExtensionSettingsScanning['modifier'],
                    },
                  })
                }
              >
                {Object.values(EXT_SCAN_KEY_MOD).map((size) => (
                  <UiSelect.Option key={size.id} value={size.id}>
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

export default SettingsScanning;
