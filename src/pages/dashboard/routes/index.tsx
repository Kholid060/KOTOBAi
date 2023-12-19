import DashboardSearchInput from '@root/src/components/Dashboard/DashboardSearchInput';

function DashboardPage() {
  return (
    <div>
      <div className="h-96 flex items-center w-full border-b border-border/70">
        <div className="w-full max-w-2xl mx-auto">
          <div className="absolute top-0 left-0 -z-10 h-96 w-full bg-gradient-to-b from-muted/80 to-transparent"></div>
          <DashboardSearchInput />
        </div>
        {/* Practice Stats */}
        {/* Bookmark Folder */}
      </div>
    </div>
  );
}

export default DashboardPage;
