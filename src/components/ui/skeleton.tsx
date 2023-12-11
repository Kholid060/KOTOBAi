import { cn } from '@src/shared/lib/shadcn-utils';

function UiSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export default UiSkeleton;
