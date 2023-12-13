import { createRoot } from 'react-dom/client';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import './index.css';
import React from 'react';
import App from './app';

refreshOnUpdate('pages/dashboard');

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

init();
