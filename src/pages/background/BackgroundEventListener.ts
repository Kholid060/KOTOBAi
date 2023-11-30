import Dictionary from '@root/src/utils/Dictionary';
import Browser from 'webextension-polyfill';

class BackgroundEventListener {
  static onInstalled({ reason }: Browser.Runtime.OnInstalledDetailsType) {
    if (reason !== 'install') return;

    Dictionary.loadData();
  }
}

export default BackgroundEventListener;
