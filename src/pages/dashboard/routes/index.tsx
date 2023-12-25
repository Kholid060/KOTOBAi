import DashboardBookmarkList from '@root/src/components/Dashboard/DashboardBookmarkList';
import DashboardNavigation from '@root/src/components/Dashboard/DashboardNavigation';
import DashboardSearchInput from '@root/src/components/Dashboard/DashboardSearchInput';
import SharedTodayWord from '@root/src/components/shared/SharedTodayWord';
import UiCard from '@root/src/components/ui/card';
import { FileStackIcon, PencilLineIcon } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function DashboardBasePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex gap-4 h-40">
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
          <button className="relative bg-emerald-400 dark:bg-emerald-500 flex items-center rounded-lg px-2 gap-2 flex-grow dark:highlight-white/10">
            <PencilLineIcon className="h-12 w-12 flex-shrink-0 dark:text-emerald-400 text-emerald-500" />
            <p className="text-lg">Practice</p>
          </button>
        </div>
        <UiCard className="flex-grow h-full">
          <UiCard.Content>Stats</UiCard.Content>
        </UiCard>
      </div>
      <DashboardBookmarkList className="mt-8" />
    </>
  );
}

function DashboardPage() {
  return (
    <div className="pb-24">
      <DashboardNavigation />
      <div className="h-[500px] bg-gradient-to-b from-muted/80 to-transparent flex items-center w-full border-border/70">
        <div className="w-full max-w-2xl mx-auto pt-10">
          <DashboardSearchInput />
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 lg:px-0">
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardPage;
