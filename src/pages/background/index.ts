import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import Browser from 'webextension-polyfill';
import BackgroundEventListener from './BackgroundEventListener';
import Dictionary from '@root/src/utils/Dictionary';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import dictWordSearcher from './messageHandler/dictWordSearcher';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.css');

Browser.runtime.onInstalled.addListener(BackgroundEventListener.onInstalled);

RuntimeMessage.onMessage('background:search-word', dictWordSearcher());

console.log('background loaded', Dictionary);
