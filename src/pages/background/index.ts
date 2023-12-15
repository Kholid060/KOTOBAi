import Browser from 'webextension-polyfill';
import BackgroundEventListener from './BackgroundEventListener';
import './runtime-message';

Browser.runtime.onInstalled.addListener(BackgroundEventListener.onInstalled);
