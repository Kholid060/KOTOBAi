import { Link } from 'react-router-dom';
import { UiButton } from '../ui/button';
import {
  ComputerIcon,
  MoonStarIcon,
  SettingsIcon,
  SunIcon,
} from 'lucide-react';
import { useContext } from 'react';
import { ThemeContext } from '@root/src/shared/context/theme.context';
import UiDropdownMenu from '../ui/dropdown-menu';
import { ThemeList } from '@root/src/shared/storages/themeStorage';
import { cn } from '@root/src/shared/lib/shadcn-utils';

const themeIcon = {
  light: SunIcon,
  dark: MoonStarIcon,
  system: ComputerIcon,
};

const themes: ThemeList[] = ['light', 'dark', 'system'];

function DashboardNavigation() {
  const { theme, setTheme } = useContext(ThemeContext);

  const ThemeIcon = themeIcon[theme];

  return (
    <div className="fixed top w-full left-0 top-4 z-[51] h-14 px-4 lg:px-0">
      <nav className="bg-background/80 backdrop-blur-sm w-full h-full mx-auto max-w-5xl rounded-lg px-4 py-2 flex items-center border">
        <Link to="/" className="flex items-center">
          <img src="/icon.png" height="28" width="28" />
          <p className="font-semibold ml-2">App Name</p>
        </Link>
        <div className="flex-grow"></div>
        <UiButton
          size="sm"
          asChild
          variant="ghost"
          className="text-muted-foreground"
        >
          <Link to="/settings">
            <SettingsIcon className="h-5 w-5" />
            <span className="ml-1">Settings</span>
          </Link>
        </UiButton>
        <hr className="h-4/6 w-px bg-border mx-2" />
        <UiDropdownMenu>
          <UiDropdownMenu.Trigger>
            <UiButton
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
            >
              <ThemeIcon className="h-5 w-5" />
            </UiButton>
          </UiDropdownMenu.Trigger>
          <UiDropdownMenu.Content className="z-[51]">
            {themes.map((item) => (
              <UiDropdownMenu.Item
                key={item}
                onClick={() => setTheme(item)}
                className={cn('capitalize', item === theme && 'bg-primary/20')}
              >
                {item}
              </UiDropdownMenu.Item>
            ))}
          </UiDropdownMenu.Content>
        </UiDropdownMenu>
      </nav>
    </div>
  );
}

export default DashboardNavigation;
