import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@src/shared/lib/shadcn-utils';
import { forwardRef } from 'react';

export const UiTooltipProvider = TooltipPrimitive.Provider;

interface UiTooltipProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  label: string | React.ReactNode;
}

const UiTooltip = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  UiTooltipProps
>(
  (
    {
      children,
      sideOffset,
      className,
      label,
      defaultOpen,
      open,
      onOpenChange,
      delayDuration = 500,
      disableHoverableContent,
      ...props
    },
    ref,
  ) => (
    <TooltipPrimitive.Root
      {...{
        defaultOpen,
        open,
        onOpenChange,
        delayDuration,
        disableHoverableContent,
      }}
    >
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        {label}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  ),
);
UiTooltip.displayName = TooltipPrimitive.Content.displayName;

export default UiTooltip;
