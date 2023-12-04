import Browser from 'webextension-polyfill';

class BackgroundEventListener {
  static onInstalled({ reason }: Browser.Runtime.OnInstalledDetailsType) {
    if (reason !== 'install') return;
  }
}

export default BackgroundEventListener;
