import DashboardBookmarkList from '@root/src/components/Dashboard/DashboardBookmarkList';
import DashboardNavigation from '@root/src/components/Dashboard/DashboardNavigation';
import DashboardSearchInput from '@root/src/components/Dashboard/DashboardSearchInput';
import SharedTodayWord from '@root/src/components/shared/SharedTodayWord';
import UiCard from '@root/src/components/ui/card';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-24">
      <DashboardNavigation />
      <div className="h-[550px] bg-gradient-to-b from-muted/80 to-transparent flex items-center w-full border-border/70">
        <div className="w-full max-w-2xl mx-auto pt-10">
          <DashboardSearchInput />
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto mt-12">
        <div className="flex gap-4">
          <SharedTodayWord
            className="w-72"
            onOpen={(entryId) => navigate(`/words/${entryId}`)}
          />
          <UiCard className="flex-grow h-48">
            <UiCard.Content>Stats</UiCard.Content>
          </UiCard>
        </div>
        <DashboardBookmarkList className="mt-4" />
      </div>
    </div>
  );
}

export default DashboardPage;
