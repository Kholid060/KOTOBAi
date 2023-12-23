import { createHashRouter } from 'react-router-dom';
import DashboardPage from './routes';
import SettingsIndex from './routes/Settings';
import SettingsDictData from './routes/settings/SettingsDictData';
import WelcomePage from './routes/welcome';
import FlashcardsPage from './routes/flashcards';

const router = createHashRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/welcome',
    element: <WelcomePage />,
  },
  {
    path: '/flashcards',
    element: <FlashcardsPage />,
  },
  {
    path: '/settings',
    element: <SettingsIndex />,
    children: [{ path: 'dictionary-data', element: <SettingsDictData /> }],
  },
]);

export default router;
