import { createHashRouter } from 'react-router-dom';
import DashboardPage from './routes';
import SettingsIndex from './routes/Settings';
import SettingsDictData from './routes/settings/SettingsDictData';
import WelcomePage from './routes/welcome';

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
    path: '/settings',
    element: <SettingsIndex />,
    children: [{ path: 'dictionary-data', element: <SettingsDictData /> }],
  },
]);

export default router;
