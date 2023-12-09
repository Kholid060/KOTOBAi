import Browser from 'webextension-polyfill';

type BadgeOpts = Pick<
  Browser.Action.SetBadgeTextDetailsType,
  'windowId' | 'tabId'
>;

async function setBadge(opts: BadgeOpts = {}) {
  await Browser.action.setBadgeText({ text: 'OFF', ...opts });
  await Browser.action.setBadgeBackgroundColor({ color: '#dc2626', ...opts });
}

async function removeBadge(opts: BadgeOpts = {}) {
  await Browser.action.setBadgeText({ text: '', ...opts });
}

const disableExtBadge = {
  set: setBadge,
  remove: removeBadge,
};

export default disableExtBadge;
