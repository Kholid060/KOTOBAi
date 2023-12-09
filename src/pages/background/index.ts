import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import Browser from 'webextension-polyfill';
import BackgroundEventListener from './BackgroundEventListener';
import Dictionary from '@root/src/utils/Dictionary';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import dictWordSearcher from './messageHandler/dictWordSearcher';
import { dictKanjiSearcher } from './messageHandler/dictKanjiSearcher';
import disableExtStorage from '@root/src/shared/storages/disableExtStorage';
import disableExtBadge from '@root/src/utils/disableExtBadge';

Browser.runtime.onInstalled.addListener(BackgroundEventListener.onInstalled);

RuntimeMessage.onMessage('background:search-word', dictWordSearcher());
RuntimeMessage.onMessage('background:search-kanji', dictKanjiSearcher);
RuntimeMessage.onMessage(
  'background:search-word-iframe',
  dictWordSearcher(true),
);
RuntimeMessage.onMessage('background:disable-ext', async (payload) => {
  let tabIds: number[] = [];

  if (payload.type === 'all') {
    await disableExtStorage.toggleDisable(payload.disable);
    tabIds = (await Browser.tabs.query({})).map((tab) => tab.id);

    if (payload.disable) await disableExtBadge.set();
    else await disableExtBadge.remove();
  } else if (payload.type === 'host') {
    if (payload.disable) await disableExtStorage.addHost(payload.host);
    else await disableExtStorage.removeHost(payload.host);

    tabIds = (await Browser.tabs.query({ url: `*://${payload.host}/*` })).map(
      (tab) => tab.id,
    );
  }

  await Promise.allSettled(
    tabIds.map(async (tabId) => {
      if (payload.type === 'host') {
        if (payload.disable) await disableExtBadge.set({ tabId });
        else await disableExtBadge.remove({ tabId });
      }

      await RuntimeMessage.sendMessageToTab(
        {
          tabId,
          name: 'content:disable-ext-state',
        },
        payload.disable,
      );
    }),
  );
});
RuntimeMessage.onMessage('background:set-disabled-badge', ({ tab }) => {
  if (!tab?.id) return;

  disableExtBadge.set({ tabId: tab.id });
});

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.css');

console.log('background loaded', Dictionary);
