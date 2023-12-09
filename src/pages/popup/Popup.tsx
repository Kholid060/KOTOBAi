import { useState } from 'react';
import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import useStorage from '@src/shared/hooks/useStorage';
import themeStorage from '@root/src/shared/storages/themeStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import disableExtStorage from '@root/src/shared/storages/disableExtStorage';
import { UiButton } from '@root/src/components/ui/button';
import RuntimeMessage, {
  DisableExtPayload,
} from '@root/src/utils/RuntimeMessage';
import { useEffectOnce } from 'usehooks-ts';
import Browser from 'webextension-polyfill';

type DisablExtType = DisableExtPayload['type'];

async function getCurrTabHost() {
  try {
    const [activeTab] = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.url) return null;

    return new URL(activeTab.url).hostname;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const Popup = () => {
  const theme = useStorage(themeStorage);

  const [extDisabled, setExtDisabled] = useState<{
    currHost: string;
    disabled: boolean;
    type: DisablExtType;
  }>({
    type: 'all',
    currHost: '',
    disabled: false,
  });

  function enableExtension() {
    RuntimeMessage.sendMessage('background:disable-ext', {
      disable: false,
      type: extDisabled.type,
      host: extDisabled.currHost,
    });
    setExtDisabled({
      type: 'all',
      currHost: '',
      disabled: false,
    });
  }
  async function disableExtension(type: DisablExtType) {
    try {
      const currTabHost = type === 'host' && (await getCurrTabHost());
      if (type === 'host' && !currTabHost) return;

      await RuntimeMessage.sendMessage('background:disable-ext', {
        disable: true,
        host: currTabHost,
        type: extDisabled.type,
      });

      setExtDisabled({
        type: type,
        disabled: true,
        currHost: currTabHost,
      });
    } catch (error) {
      console.error(error);
    }
  }

  useEffectOnce(() => {
    (async () => {
      try {
        const disableState = await disableExtStorage.get();
        if (disableState.disabled) {
          setExtDisabled({
            type: 'all',
            currHost: '',
            disabled: true,
          });
          return;
        }

        const activeTabHost = await getCurrTabHost();
        const isHostDisabled = disableState.hostList.includes(activeTabHost);
        if (!isHostDisabled) return;

        setExtDisabled({
          type: 'host',
          disabled: true,
          currHost: activeTabHost,
        });
      } catch (error) {
        console.error(error);
      }
    })();
  });

  return (
    <div
      className="App"
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#000',
      }}
    >
      <header
        className="App-header"
        style={{ color: theme === 'light' ? '#000' : '#fff' }}
      >
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/pages/popup/Popup.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: theme === 'light' && '#0281dc',
            marginBottom: '10px',
          }}
        >
          Learn React!
        </a>
        <button
          style={{
            backgroundColor: theme === 'light' ? '#fff' : '#000',
            color: theme === 'light' ? '#000' : '#fff',
          }}
          onClick={themeStorage.toggle}
        >
          Toggle theme
        </button>
        {extDisabled.disabled ? (
          <UiButton onClick={enableExtension}>Enabled</UiButton>
        ) : (
          <UiButton onClick={() => disableExtension('all')}>
            Disable Extension
          </UiButton>
        )}
      </header>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Popup, <div> Loading ... </div>),
  <div> Error Occur </div>,
);
