import DashboardBookmarkList from '@root/src/components/Dashboard/DashboardBookmarkList';
import DashboardFooter from '@root/src/components/Dashboard/DashboardFooter';
import DashboardNavigation from '@root/src/components/Dashboard/DashboardNavigation';
import DashboardPractice from '@root/src/components/Dashboard/DashboardPratice';
import DashboardSearchInput from '@root/src/components/Dashboard/DashboardSearchInput';
import DashboardStats from '@root/src/components/Dashboard/DashboardStats';
import SharedTodayWord from '@root/src/components/shared/SharedTodayWord';
import { FileStackIcon } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function DashboardBasePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex gap-4 h-44">
        <SharedTodayWord
          className="w-64"
          onOpen={(entryId) => navigate(`/words/${entryId}`)}
        />
        <div className="w-48 flex flex-col gap-4">
          <Link
            to="/flashcards"
            className="bg-indigo-400 dark:bg-indigo-500 flex items-center rounded-lg px-2 gap-2 relative flex-grow dark:highlight-white/10"
          >
            <FileStackIcon className="h-12 w-12 flex-shrink-0 dark:text-indigo-400 text-indigo-500" />
            <p className="text-lg">Flashcards</p>
          </Link>
          <DashboardPractice />
        </div>
        <DashboardStats className="h-full flex-grow" />
      </div>
      <DashboardBookmarkList className="mt-8" />
    </>
  );
}

function DashboardPage() {
  return (
    <>
      <DashboardNavigation />
      <div className="h-[500px] bg-gradient-to-b from-muted/80 to-transparent flex items-center w-full border-border/70">
        <div className="w-full max-w-2xl mx-auto pt-10">
          <DashboardSearchInput />
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-0">
        <Outlet />
        <DashboardFooter />
      </div>
    </>
  );
}

export default DashboardPage;
