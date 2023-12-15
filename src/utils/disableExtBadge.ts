import Browser from 'webextension-polyfill';

type IconOpts = Pick<Browser.Action.SetIconDetailsType, 'windowId' | 'tabId'>;

function setBadge(opts: IconOpts = {}) {
  return Browser.action.setIcon({ path: '/icon-bw.png', ...opts });
}

function removeBadge(opts: IconOpts = {}) {
  return Browser.action.setIcon({ path: '/icon.png', ...opts });
}

const disableExtBadge = {
  set: setBadge,
  remove: removeBadge,
};

export default disableExtBadge;
