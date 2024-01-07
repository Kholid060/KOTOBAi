import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import App from '@root/src/pages/content/ui/app';
import browser from 'webextension-polyfill';
import fontCss from '@assets/style/fonts.css?inline';
import { isInMainFrame } from '../content-handler/content-handler-utils';
import themeStorage from '@root/src/shared/storages/themeStorage';
import disableExtStorage from '@root/src/shared/storages/disableExtStorage';
import { name } from '@root/package.json';

refreshOnUpdate('pages/content');

export const CONTENT_ROOT_EL_ID = `${name}-extension-root`;

async function applyTheme(rootEl: HTMLElement) {
  try {
    const currTheme = await themeStorage.get();
    if (currTheme === 'dark') rootEl.classList.add('dark');
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  try {
    if (!isInMainFrame()) return;

    const root = document.createElement('div');
    root.style.all = 'unset';
    root.id = CONTENT_ROOT_EL_ID;

    document.body.append(root);

    const rootIntoShadow = document.createElement('div');
    rootIntoShadow.id = 'shadow-root';
    rootIntoShadow.classList.add('font-sans', 'text-foreground');

    const shadowRoot = root.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(rootIntoShadow);

    // Main Style
    const mainStyleURL = browser.runtime.getURL(
      '/assets/css/Contentstyle.chunk.css',
    );
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.href = mainStyleURL;
    shadowRoot.appendChild(style);

    // Font styyle
    const fontURL = browser.runtime.getURL('/assets/');
    const fontStyle = document.createElement('style');
    fontStyle.textContent = fontCss.replaceAll('/assets/', fontURL);
    document.head.appendChild(fontStyle);

    applyTheme(rootIntoShadow);

    /**
     * https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/pull/174
     *
     * In the firefox environment, the adoptedStyleSheets bug may prevent contentStyle from being applied properly.
     * Please refer to the PR link above and go back to the contentStyle.css implementation, or raise a PR if you have a better way to improve it.
     */
    const disableState = await disableExtStorage.get();
    const isDisabled =
      disableState.disabled ||
      disableState.hostList.includes(window.location.hostname);

    createRoot(rootIntoShadow).render(
      <App disabled={isDisabled} shadowRoot={shadowRoot} />,
    );
  } catch (error) {
    console.error(error);
  }
})();
