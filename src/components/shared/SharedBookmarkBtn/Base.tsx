import { cn } from '@root/src/shared/lib/shadcn-utils';
import { BookmarkIcon } from 'lucide-react';
import { UiButton, UiButtonProps } from '../../ui/button';
import UiTooltip from '../../ui/tooltip';
import { BookmarkDictionaryPayload } from '@root/src/utils/RuntimeMessage';

export interface SharedBookmarkBtnProps extends UiButtonProps {
  onValueChange?: (value: boolean) => void;
  entry: { id: number; type: BookmarkDictionaryPayload['type'] };
}

function SharedBookmarkBtnBase({
  isBookmarked,
  ...props
}: UiButtonProps & { isBookmarked: boolean }) {
  return (
    <UiTooltip label={isBookmarked ? 'Remove bookmark' : 'Bookmark word'}>
      <UiButton
        className="ml-1 flex-shrink-0"
        size="icon-xs"
        variant="secondary"
        {...props}
      >
        <BookmarkIcon
          className={cn('h-4 w-4', isBookmarked && 'text-primary fill-primary')}
        />
      </UiButton>
    </UiTooltip>
  );
}

export default SharedBookmarkBtnBase;
