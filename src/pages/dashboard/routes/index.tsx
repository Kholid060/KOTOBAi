import DashboardSearchInput from '@root/src/components/Dashboard/DashboardSearchInput';

function DashboardPage() {
  return (
    <div>
      <div className="h-96 flex items-center w-full border-b">
        <div className="w-full max-w-2xl mx-auto">
          <div className="absolute top-0 left-0 -z-10 h-4/6 w-8/12 bg-gradient-to-br from-cyan-700/30 via-blue-700/30 dark:from-cyan-500/10 dark:via-blue-500/10 to-50% to-transparent"></div>
          <DashboardSearchInput />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
