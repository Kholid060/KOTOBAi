import { createRoot } from 'react-dom/client';
import Newtab from '@root/src/pages/dashboard/Dashboard';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import './index.css';

refreshOnUpdate('pages/newtab');

function init() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(<Newtab />);
}

init();
