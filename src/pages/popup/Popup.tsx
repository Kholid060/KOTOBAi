import { UiButton } from '@root/src/components/ui/button';
import UiSeparator from '@root/src/components/ui/separator';
import { HomeIcon, SearchIcon } from 'lucide-react';
import PopupDisableBtn from './PopupDisableBtn';
import { useState } from 'react';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import Browser from 'webextension-polyfill';
import SharedTodayWord from '@root/src/components/shared/SharedTodayWord';

function Popup() {
  const [isExtDisabled, setExtDisabled] = useState(false);

  async function openDashboard(path = '') {
    try {
      const EXT_URL = Browser.runtime.getURL('');
      const [dashboardTab] = await Browser.tabs.query({
        currentWindow: true,
        url: `${EXT_URL}/**/*`,
      });
      if (dashboardTab) {
        await Browser.tabs.update(dashboardTab.id, { active: true });
        return;
      }

      await Browser.tabs.create({
        active: true,
        url: `${EXT_URL}src/pages/dashboard/index.html#${path}`,
      });
    } catch (error) {
      console.error(error);
    }
  }
  async function searchEntry() {
    try {
      if (isExtDisabled) {
        await openDashboard();
        window.close();
        return;
      }

      const [currentTab] = await Browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!currentTab?.url) return;

      if (!currentTab.url.startsWith('http')) {
        await openDashboard();
      } else {
        await RuntimeMessage.sendMessageToTab({
          frameId: 0,
          tabId: currentTab.id,
          name: 'content:open-search-command',
        });
      }

      window.close();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <img src="/icon.png" width="26" alt="icon" />
        <h1 className="font-semibold">App Name</h1>
      </div>
      <div className="flex items-center gap-2 mt-6 text-muted-foreground">
        <div className="flex items-center border rounded-lg flex-grow bg-muted/50">
          <UiButton
            variant="ghost"
            onClick={() => openDashboard()}
            className="flex-1 text-foreground text-left justify-start"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="ml-2">Dashboard</span>
          </UiButton>
          <UiSeparator className="w-px h-7" />
          <UiButton variant="ghost" onClick={searchEntry} size="icon">
            <SearchIcon className="h-5 w-5" />
          </UiButton>
        </div>
        <PopupDisableBtn onValueChanged={setExtDisabled} />
      </div>
      <SharedTodayWord
        className="mt-4"
        onOpen={(entryId) => openDashboard(`/words/${entryId}`)}
      />
    </div>
  );
}

export default Popup;
