import DashboardFooter from '@root/src/components/Dashboard/DashboardFooter';
import SettingsAnki from '@root/src/components/Settings/SettingsAnki';
import SettingsDictionaryData from '@root/src/components/Settings/SettingsDictionaryData';
import SettingsGeneral from '@root/src/components/Settings/SettingsGeneral';
import SettingsPopup from '@root/src/components/Settings/SettingsPopup';
import SettingsScanning from '@root/src/components/Settings/SettingsScanning';
import { useTitle } from '@root/src/shared/hooks/useTitle';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import extSettingsStorage, {
  ExtensionSettings,
} from '@root/src/shared/storages/extSettingsStorage';
import deepmerge from 'deepmerge';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PartialDeep } from 'type-fest';
import { useEffectOnce } from 'usehooks-ts';
import Browser from 'webextension-polyfill';

export interface SettingsPageSectionProps {
  settings: ExtensionSettings;
  updateSettings?: (settings: PartialDeep<ExtensionSettings>) => void;
}

const settingsSections = [
  { id: 'general', name: 'General', Component: SettingsGeneral },
  { id: 'popup-apperance', name: 'Popup Apperance', Component: SettingsPopup },
  { id: 'scanning', name: 'Text Scanning', Component: SettingsScanning },
  { id: 'anki', name: 'Anki Integration', Component: SettingsAnki },
  {
    id: 'dictionary-data',
    name: 'Dictionary Data',
    Component: SettingsDictionaryData,
  },
];

function SettingsContentList() {
  const location = useLocation();
  const navigate = useNavigate();

  const sectionsEl = useRef<Record<string, HTMLElement>>({});

  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const id = location.hash.substring(1);

    let element: HTMLElement | null = sectionsEl.current[id];
    if (!element) element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView();
  }, [location.hash]);
  useEffectOnce(() => {
    const sections =
      document.querySelectorAll<HTMLElement>('.settings-section');

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectEntry = entries.find(
          ({ isIntersecting }) => isIntersecting,
        );
        if (!intersectEntry) return;

        setActiveSection(intersectEntry.target.id);
      },
      { threshold: 1 },
    );

    sections.forEach((section) => {
      observer.observe(section);
      sectionsEl.current[section.id] = section;
    });

    return () => {
      observer.disconnect();
    };
  });

  return (
    <ul className="flex-shrink-0 text-muted-foreground w-56 sticky top-8">
      {settingsSections.map((section) => (
        <li
          key={section.id}
          className={cn(
            'border-l-2 cursor-pointer px-4 py-2 transition-all hover:text-foreground',
            section.id === activeSection &&
              'border-primary/80 bg-primary/20 text-foreground font-semibold',
          )}
          onClick={() => navigate(`#${section.id}`)}
        >
          {section.name}
        </li>
      ))}
    </ul>
  );
}

function SettingsIndexPage() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

  useTitle('Settings');

  function updateSettings(newSettings: PartialDeep<ExtensionSettings>) {
    setSettings(deepmerge(settings || {}, newSettings) as ExtensionSettings);
    extSettingsStorage.update(newSettings);
  }

  useEffectOnce(() => {
    const storageListener = (
      changes: Browser.Storage.StorageAreaOnChangedChangesType,
    ) => {
      const updatedSettings = changes[extSettingsStorage.$key];
      if (!updatedSettings) return;

      setSettings(updatedSettings.newValue as ExtensionSettings);
    };

    extSettingsStorage.get().then((savedSettings) => {
      setSettings(deepmerge(extSettingsStorage.$defaultValue, savedSettings));
    });
    Browser.storage.local.onChanged.addListener(storageListener);

    return () => {
      setSettings(null);
      Browser.storage.local.onChanged.removeListener(storageListener);
    };
  });

  if (!settings) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 lg:px-0 pt-24">
      <div className="absolute top-0 left-0 -z-10 h-4/6 w-8/12 bg-gradient-to-br from-transparent via-primary/30 dark:from-transparent dark:via-primary/10 to-40% to-transparent"></div>
      <Link
        to="/"
        className="text-sm text-muted-foreground mb-1 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <h3 className="text-3xl font-bold mb-10">Settings</h3>
      <div className="flex items-start gap-8">
        <div className="flex-grow space-y-14">
          {settingsSections.map((section) => (
            <section.Component
              key={section.id}
              id={section.id}
              settings={settings}
              className="settings-section"
              updateSettings={updateSettings}
            />
          ))}
        </div>
        <SettingsContentList />
      </div>
      <DashboardFooter />
    </div>
  );
}

export default SettingsIndexPage;
