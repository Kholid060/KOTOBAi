import { createHashRouter, useNavigate } from 'react-router-dom';
import DashboardPage, { DashboardBasePage } from './routes';
import SettingsIndexPage from './routes/Settings';
import WelcomePage from './routes/welcome';
import FlashcardsPage from './routes/flashcards';
import WordDetailPage from './routes/words/[entryId]';
import KanjiDetailPage from './routes/kanji/[entryId]';
import NameDetailPage from './routes/names/[entryId]';
import AboutPage from './routes/About';
import PracticePage from './routes/Practice';
import { useEffectOnce } from 'usehooks-ts';
import { useState } from 'react';
import dictDB from '@root/src/shared/db/dict.db';

const Guard = ({ component: Component }: { component: React.FC }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffectOnce(() => {
    dictDB.metadata.count().then((dictLength) => {
      if (dictLength === 0) {
        navigate('/welcome', { replace: true });
      } else {
        setIsLoading(false);
      }
    });
  });

  if (isLoading) return null;

  return <Component />;
};

const router = createHashRouter([
  {
    path: '/',
    element: <Guard component={DashboardPage} />,
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
    element: <Guard component={FlashcardsPage} />,
  },
  {
    path: '/settings',
    element: <SettingsIndexPage />,
  },
  {
    path: '/practice',
    element: <Guard component={PracticePage} />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
]);

export default router;
