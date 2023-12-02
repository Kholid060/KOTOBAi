import {
  useFloating,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import type { UseFloatingOptions, UseFloatingReturn } from '@floating-ui/react';
import { forwardRef, useImperativeHandle } from 'react';

export interface WordPopoverProps
  extends React.DetailsHTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  children: React.ReactNode;
  placement?: UseFloatingOptions['placement'];
  onOpenChange?: UseFloatingOptions['onOpenChange'];
}

export type WordPopoverRef = UseFloatingReturn;

const WordPopover = forwardRef<WordPopoverRef, WordPopoverProps>(
  ({ children, isOpen, onOpenChange, placement = 'bottom', ...props }, ref) => {
    const data = useFloating({
      placement,
      open: isOpen,
      onOpenChange,
      middleware: [
        offset(5),
        flip({
          padding: 5,
          fallbackAxisSideDirection: 'end',
        }),
        shift({ padding: 5 }),
      ],
    });

    useImperativeHandle(ref, () => data, [data]);

    const role = useRole(data.context);
    const click = useClick(data.context);
    const dismiss = useDismiss(data.context);

    const { getFloatingProps } = useInteractions([click, dismiss, role]);

    if (!data.context.open) return null;

    return (
      <div
        ref={data.refs.setFloating}
        style={data.floatingStyles}
        {...getFloatingProps()}
        {...props}
      >
        {children}
      </div>
    );
  },
);
WordPopover.displayName = 'WordPopover';

export default WordPopover;
