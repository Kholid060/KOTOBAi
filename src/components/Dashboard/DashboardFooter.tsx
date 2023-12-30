import { cn } from '@root/src/shared/lib/shadcn-utils';
import { Link } from 'react-router-dom';
import UiSeparator from '../ui/separator';
import { GITHUB_URL } from '@root/src/shared/constant/constant';

function DashboardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        'flex text-muted-foreground items-center justify-center mt-24 mb-12',
        className,
      )}
      {...props}
    >
      <Link to="/about" className="hover:underline hover:text-foreground">
        About
      </Link>
      <UiSeparator orientation="vertical" className="h-4 mx-4" />
      <a
        href={GITHUB_URL}
        rel="noreferrer"
        target="_blank"
        className="hover:underline hover:text-foreground"
      >
        GitHub
      </a>
    </footer>
  );
}

export default DashboardFooter;
