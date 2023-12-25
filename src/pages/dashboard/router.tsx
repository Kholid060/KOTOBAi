import { createHashRouter } from 'react-router-dom';
import DashboardPage, { DashboardBasePage } from './routes';
import SettingsIndex from './routes/Settings';
import SettingsDictData from './routes/settings/SettingsDictData';
import WelcomePage from './routes/welcome';
import FlashcardsPage from './routes/flashcards';
import WordDetailPage from './routes/words/[entryId]';
import KanjiDetailPage from './routes/kanji/[entryId]';
import NameDetailPage from './routes/names/[entryId]';

const router = createHashRouter([
  {
    path: '/',
    element: <DashboardPage />,
    children: [
      {
        path: '/',
        element: <DashboardBasePage />,
      },
      {
        path: '/words/:entryId',
        element: <WordDetailPage />,
      },
      {
        path: '/kanji/:entryId',
        element: <KanjiDetailPage />,
      },
      {
        path: '/names/:entryId',
        element: <NameDetailPage />,
      },
    ],
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
