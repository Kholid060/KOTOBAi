import UiCard from '../ui/card';
import darkThemePng from '@assets/img/dark.png';
import lightThemePng from '@assets/img/light.png';
import systemThemePng from '@assets/img/system.png';
import { ThemeContext } from '@root/src/shared/context/theme.context';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import { ThemeList } from '@root/src/shared/storages/themeStorage';
import { useContext } from 'react';
import { SettingsPageSectionProps } from '@root/src/pages/dashboard/routes/Settings';

const APP_THEME = [
  { id: 'light', name: 'Light', img: lightThemePng },
  { id: 'dark', name: 'Dark', img: darkThemePng },
  { id: 'system', name: 'System', img: systemThemePng },
];

function SettingsGeneral(
  props: SettingsPageSectionProps & React.HTMLAttributes<HTMLDivElement>,
) {
  const currCtx = useContext(ThemeContext);

  return (
    <UiCard {...props}>
      <UiCard.Header className="text-lg font-semibold">General</UiCard.Header>
      <UiCard.Content>
        <p className="font-medium">Theme</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          {APP_THEME.map((theme) => (
            <button
              key={theme.id}
              className="text-left"
              onClick={() => currCtx.setTheme(theme.id as ThemeList)}
            >
              <img
                src={theme.img}
                className={cn(
                  'w-36 rounded-md h-20 object-cover object-top border-[3px]',
                  currCtx.theme === theme.id && 'border-primary',
                )}
              />
              <p
                className={cn(
                  'pl-1 text-sm',
                  currCtx.theme === theme.id && 'text-foreground',
                )}
              >
                {theme.name}
              </p>
            </button>
          ))}
        </div>
      </UiCard.Content>
    </UiCard>
  );
}

export default SettingsGeneral;
