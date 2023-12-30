import { createHashRouter } from 'react-router-dom';
import DashboardPage, { DashboardBasePage } from './routes';
import SettingsIndex from './routes/Settings';
import WelcomePage from './routes/welcome';
import FlashcardsPage from './routes/flashcards';
import WordDetailPage from './routes/words/[entryId]';
import KanjiDetailPage from './routes/kanji/[entryId]';
import NameDetailPage from './routes/names/[entryId]';
import AboutPage from './routes/About';
import PracticePage from './routes/Practice';

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
  },
  {
    path: '/practice',
    element: <PracticePage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
]);

export default router;
