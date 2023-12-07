import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@src/shared/lib/shadcn-utils';
import { SelectContentProps } from '@radix-ui/react-select';
import { VariantProps, cva } from 'class-variance-authority';

const UiSelectGroup = SelectPrimitive.Group;

export const uiSelectVariants = cva(
  'flex h-10 w-full items-center justify-between relative rounded-md ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-input hover:border-mauve-8 dark:hover:border-mauvedark-8 bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface UiSelectProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
    VariantProps<typeof uiSelectVariants> {
  className?: string;
  placeholder?: string;
  contentClass?: string;
  viewportClass?: string;
  triggerLeft?: React.ReactNode;
  position?: SelectContentProps['position'];
}

export const UiSelectRoot = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Root>,
  UiSelectProps
>(
  (
    {
      children,
      position = 'popper',
      variant,
      size,
      className,
      placeholder,
      viewportClass,
      triggerLeft,
      contentClass,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <SelectPrimitive.Root {...props}>
        <SelectPrimitive.Trigger
          ref={forwardedRef}
          className={cn(uiSelectVariants({ variant, size, className }))}
        >
          {triggerLeft}
          <span className="truncate flex-1 text-left">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon>
            <ChevronDown />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              position === 'popper' &&
                'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
              contentClass,
            )}
            position={position}
          >
            <SelectPrimitive.ScrollUpButton>
              <ChevronUp />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport
              className={cn(
                'p-1',
                position === 'popper' &&
                  'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
                viewportClass,
              )}
            >
              {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton>
              <ChevronDown />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);
UiSelectRoot.displayName = SelectPrimitive.Root.displayName;

const UiSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
UiSelectLabel.displayName = SelectPrimitive.Label.displayName;

export type UiSelectOptionRef = React.ElementRef<typeof SelectPrimitive.Item>;
export type UiSelectOptionProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Item
>;
const UiSelectOption = React.forwardRef<UiSelectOptionRef, UiSelectOptionProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ),
);
UiSelectOption.displayName = SelectPrimitive.Item.displayName;

const UiSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
UiSelectSeparator.displayName = SelectPrimitive.Separator.displayName;

const UiSelect = Object.assign(UiSelectRoot, {
  Group: UiSelectGroup,
  Label: UiSelectLabel,
  Option: UiSelectOption,
  Separator: UiSelectSeparator,
});

export default UiSelect;
