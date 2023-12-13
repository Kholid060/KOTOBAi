import Browser from 'webextension-polyfill';

class BackgroundEventListener {
  static onInstalled({ reason }: Browser.Runtime.OnInstalledDetailsType) {
    if (reason !== 'install') return;

    const welcomPageURL = Browser.runtime.getURL(
      '/src/pages/dashboard/index.html#welcome',
    );
    Browser.tabs.create({ active: true, url: welcomPageURL });
  }
}

export default BackgroundEventListener;
