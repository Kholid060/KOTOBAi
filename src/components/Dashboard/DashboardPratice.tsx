import { PencilLineIcon } from 'lucide-react';
import UiDialog from '../ui/dialog';
import { Fragment, useState } from 'react';
import bookmarkDB from '@root/src/shared/db/bookmark.db';
import { BOOKMARK_ITEM_STATUS } from '@root/src/interface/bookmark.interface';
import UiInput from '../ui/input';
import { UiButton } from '../ui/button';
import { PRACTICE_TYPE } from '@root/src/interface/practice.interface';
import UiSwitch from '../ui/switch';
import { Link } from 'react-router-dom';

const questionTypes: { id: PRACTICE_TYPE; name: string }[] = [
  { id: PRACTICE_TYPE.MULTIPLE, name: 'Multiple choices' },
  { id: PRACTICE_TYPE.BOOLEAN, name: 'True or false' },
  // { id: PRACTICE_TYPE.KANJI_STROKE, name: 'Kanji stroke order' },
];

function DashboardPractice() {
  const [bookmarksLen, setBookmarksLen] = useState(0);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [practiceType, setPracticeType] = useState<PRACTICE_TYPE[]>([
    PRACTICE_TYPE.MULTIPLE,
    PRACTICE_TYPE.BOOLEAN,
  ]);

  function onOpenChange(isOpen: boolean) {
    if (!isOpen) return;

    bookmarkDB.items
      .where('status')
      .equals(BOOKMARK_ITEM_STATUS.LEARN)
      .count()
      .then((bookmakrsCount) => {
        setBookmarksLen(bookmakrsCount);
        setQuestionsCount(Math.min(20, bookmakrsCount));
      });
  }

  const disabledBtn =
    bookmarksLen <= 0 || questionsCount <= 0 || practiceType.length <= 0;

  return (
    <UiDialog onOpenChange={onOpenChange}>
      <UiDialog.Trigger asChild>
        <button className="relative bg-emerald-400 dark:bg-emerald-500 flex items-center rounded-lg px-2 gap-2 flex-grow dark:highlight-white/10">
          <PencilLineIcon className="h-12 w-12 flex-shrink-0 dark:text-emerald-400 text-emerald-500" />
          <p className="text-lg leading-tight">Practice</p>
        </button>
      </UiDialog.Trigger>
      <UiDialog.Content className="max-w-md">
        <UiDialog.Header>
          <p className="font-semibold text-foreground">Setup your practice</p>
        </UiDialog.Header>
        <div className="grid grid-cols-2 justify-between items-center gap-4">
          <p>Questions count (max. {bookmarksLen})</p>
          <div className="text-right">
            <UiInput
              value={questionsCount}
              type="number"
              placeholder="0"
              className="w-24 inline-block"
              onChange={(event) => {
                setQuestionsCount(
                  Math.min(
                    Math.max(0, event.target.valueAsNumber),
                    bookmarksLen,
                  ),
                );
              }}
            />
          </div>
          {questionTypes.map((type) => (
            <Fragment key={type.id}>
              <p>{type.name}</p>
              <div className="text-right">
                <UiSwitch
                  checked={practiceType.includes(type.id)}
                  onCheckedChange={(checked) => {
                    setPracticeType((prevState) =>
                      checked
                        ? [...prevState, type.id]
                        : prevState.filter((item) => item !== type.id),
                    );
                  }}
                />
              </div>
            </Fragment>
          ))}
        </div>
        <UiDialog.Footer className="justify-end mt-4">
          <UiDialog.Close asChild>
            <UiButton variant="ghost">Cancel</UiButton>
          </UiDialog.Close>
          <UiButton disabled={disabledBtn} asChild={!disabledBtn}>
            <Link
              to="/practice"
              state={{
                practice: { type: practiceType, length: questionsCount },
              }}
            >
              Start practice
            </Link>
          </UiButton>
        </UiDialog.Footer>
      </UiDialog.Content>
    </UiDialog>
  );
}

export default DashboardPractice;
