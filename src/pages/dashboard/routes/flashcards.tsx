import {
  BOOKMARK_ITEM_STATUS,
  BookmarkItem,
} from '@root/src/interface/bookmark.interface';
import bookmarkDB from '@root/src/shared/db/bookmark.db';
import { animated, easings, useSpring, useTransition } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon, Undo2Icon, Volume2Icon, XIcon } from 'lucide-react';
import UiProgress from '@root/src/components/ui/progress';
import { Link } from 'react-router-dom';
import { UiButton } from '@root/src/components/ui/button';
import { useEffectOnce, useEventListener } from 'usehooks-ts';
import { DICTIONARY_NAME } from '@root/src/shared/constant/constant';
import UiTooltip from '@root/src/components/ui/tooltip';
import { useSpeechSynthesis } from '@root/src/shared/hooks/useSpeechSynthesis';
import UiSkeleton from '@root/src/components/ui/skeleton';
import emptySvg from '@assets/svg/empty.svg';
import dayjs from 'dayjs';

type ChangeIndexType = 'learned' | 'undo';

const MIN_SWIPE_MARK = 50;
const ITEM_TYPE_NAME = {
  [DICTIONARY_NAME.JMDICT]: 'Word',
  [DICTIONARY_NAME.ENAMDICT]: 'Name',
  [DICTIONARY_NAME.KANJIDIC]: 'Kanji',
};

function FlashcardMeaning({
  item,
  show,
  onClose,
}: {
  show: boolean;
  item: BookmarkItem;
  onClose?: () => void;
}) {
  const MEANING_CARD_MAX_HEIGHT = 384;
  const transitions = useTransition(show ? [show] : [], {
    from: { y: MEANING_CARD_MAX_HEIGHT },
    enter: { y: 0 },
    leave: { y: MEANING_CARD_MAX_HEIGHT },
    config: { duration: 400, easing: easings.easeOutQuart },
  });

  return transitions((style) => (
    <div
      onClick={(event) => {
        if ((event.target as HTMLElement).id !== 'card-meaning-overlay') return;

        onClose?.();
      }}
      id="card-meaning-overlay"
      className="absolute h-full w-full top-0 left-0 flex p-4 items-end backdrop-blur-sm bg-background/60"
    >
      <animated.div
        className="bg-muted min-h-[250px] w-full rounded-lg p-6 text-lg max-h-96 overflow-auto"
        style={style}
      >
        <p className="text-muted-foreground text-sm uppercase">
          [{ITEM_TYPE_NAME[item.type]}]
        </p>
        {item.kanji && (
          <p className="leading-tight mt-1 font-sans-jp mb-2 dark:text-emerald-400 text-emerald-700">
            {item.reading.join('、')}
          </p>
        )}
        <p className="first-letter:capitalize">{item.meaning.join('; ')}</p>
      </animated.div>
    </div>
  ));
}
function FlashcardDecks({
  cards,
  onChangeIdx,
  activeIndex,
}: {
  cards: BookmarkItem[];
  activeIndex: number;
  onChangeIdx?: (idx: number, type?: ChangeIndexType) => void;
}) {
  const isGone = useRef(false);
  const isDragging = useRef(false);
  const cardElRef = useRef<HTMLDivElement>(null);

  const [showMeaning, setShowMeaning] = useState(false);

  const { isSpeechAvailable, speak } = useSpeechSynthesis();
  const [spring, api] = useSpring(
    () => ({
      from: { scale: 1, y: 100, x: 0, rotate: 0 },
      to: {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
      },
    }),
    [],
  );

  const currCard = cards[activeIndex];
  const speakWord = currCard.reading[0] || currCard.kanji?.[0] || '';

  function swipeCard(dir: 'left' | 'right') {
    const { innerWidth } = window;

    api.start(() => ({
      config: { friction: 50, tension: 500 },
      x: dir === 'left' ? -innerWidth : innerWidth,
    }));

    setTimeout(() => {
      onChangeIdx?.(activeIndex + 1, dir === 'right' ? 'learned' : undefined);
      api.start(() => ({
        x: 0,
        rotate: 0,
      }));
    }, 150);

    isGone.current = false;
  }

  useEventListener('keyup', ({ code, ctrlKey }) => {
    switch (code) {
      case 'ArrowLeft':
      case 'ArrowRight':
        swipeCard(code === 'ArrowLeft' ? 'left' : 'right');
        break;
      case 'KeyZ': {
        if (ctrlKey && onChangeIdx) onChangeIdx(Math.max(activeIndex - 1, 0));
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Space':
        setShowMeaning(!showMeaning);
        break;
      case 'KeyP':
        speak(speakWord);
        break;
    }
  });

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], event }) => {
      event.preventDefault();
      event.stopPropagation();

      const cardEl = cardElRef.current;
      const trigger =
        vx >= 1 || (cardEl && Math.abs(mx) > cardEl.clientWidth * 0.7);

      if (!active && trigger) isGone.current = true;

      if (isGone.current) {
        swipeCard(mx > 0 ? 'right' : 'left');
      } else {
        api.start(() => ({
          x: active ? mx : 0,
          rotate: active ? mx / 100 + 2 * dx : 0,
        }));
      }

      if (cardEl) {
        cardEl.classList.toggle(
          '!ring-amber-200',
          active && mx < -MIN_SWIPE_MARK,
        );
        cardEl.classList.toggle(
          '!ring-emerald-200',
          active && mx > MIN_SWIPE_MARK,
        );

        cardElRef.current.style.setProperty(
          'cursor',
          active ? 'grabbing' : 'grab',
        );
      }

      const isMove = Math.abs(mx) > 10;
      if (active && isMove) {
        isDragging.current = true;
      } else if (isMove) {
        setTimeout(() => (isDragging.current = false), 100);
      }
    },
    {},
  );

  useEffect(() => {
    setShowMeaning(false);
  }, [activeIndex]);

  return (
    <>
      <div className="flex-grow relative select-none">
        <animated.div
          ref={cardElRef}
          className="h-full border bg-card p-6 z-10 ring ring-transparent cursor-grab rounded-lg overflow-hidden absolute top-0 left-0 w-full"
          style={spring}
          {...bind()}
        >
          <div
            className="flex flex-col justify-center items-center font-sans-jp text-4xl h-full"
            onClick={() => {
              if (!isDragging.current) setShowMeaning(true);
            }}
          >
            {currCard.kanji ? (
              <p className="leading-tight dark:text-indigo-400 text-indigo-600">
                {currCard.kanji?.join('、')}
              </p>
            ) : (
              <p className="leading-tight mt-1 dark:text-emerald-400 text-emerald-700">
                {currCard.reading.join('、')}
              </p>
            )}
          </div>
          {isSpeechAvailable && (
            <button
              className="absolute top-4 right-4"
              onClick={() => speak(speakWord)}
            >
              <Volume2Icon className="h-5 w-5" />
            </button>
          )}
          <FlashcardMeaning
            onClose={() => setShowMeaning(false)}
            item={currCard}
            show={showMeaning}
          />
        </animated.div>
      </div>
      <div className="flex items-center">
        <UiTooltip label="Undo (ctrl+z)">
          <UiButton
            size="icon"
            disabled={activeIndex <= 0}
            variant="secondary"
            onClick={() => onChangeIdx(activeIndex - 1, 'undo')}
          >
            <Undo2Icon className="h-5 w-5" />
          </UiButton>
        </UiTooltip>
        <div className="flex-grow"></div>
        <UiButton
          variant="secondary"
          className="text-amber-600 dark:text-amber-400"
          onClick={() => swipeCard('left')}
        >
          <XIcon className="h-5 w-5 mr-2" />
          Don&apos;t know
        </UiButton>
        <UiButton
          variant="secondary"
          className="ml-4 dark:text-emerald-400 text-emerald-600"
          onClick={() => swipeCard('right')}
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Know
        </UiButton>
      </div>
    </>
  );
}

function FlashcardsPage() {
  const learnedStatus = useRef<Map<number, number>>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  const queryBookmarks = useCallback(async () => {
    const lastMonthDate = dayjs().subtract(30, 'day');
    const [items, reReviewItems] = await Promise.all([
      bookmarkDB.items.where({ status: BOOKMARK_ITEM_STATUS.LEARN }).toArray(),
      bookmarkDB.items
        .where('lastReviewedAt')
        .belowOrEqual(lastMonthDate.date())
        .limit(10)
        .toArray(),
    ]);

    const reReview = reReviewItems.filter(
      (reviewItem) => !items.some((item) => item.id === reviewItem.id),
    );

    return [...items, ...reReview];
  }, []);

  function updateCardIndex(index: number, type?: ChangeIndexType) {
    setActiveCardIdx(Math.max(index, 0));
    if (typeof type !== 'string') return;

    const currIndex = type === 'learned' ? index - 1 : index + 1;
    const bookmarkId = bookmarks[currIndex].id;
    console.log(currIndex, bookmarks[currIndex], type);

    if (type === 'learned') {
      learnedStatus.current.set(bookmarkId, bookmarkId);
    } else if (type === 'undo') {
      learnedStatus.current.delete(currIndex);
    }

    bookmarkDB.items.update(bookmarkId, {
      status:
        type === 'learned'
          ? BOOKMARK_ITEM_STATUS.LEARNED
          : BOOKMARK_ITEM_STATUS.LEARN,
    });
  }
  function keepReviewing() {
    setIsLoading(true);

    queryBookmarks()
      .then((newBookmarks) => {
        setActiveCardIdx(0);
        setBookmarks(newBookmarks);
        learnedStatus.current = new Map();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }
  async function restartFlashcards() {
    try {
      await Promise.all(
        [...learnedStatus.current].map(([_itemIdx, itemId]) =>
          bookmarkDB.items.update(itemId, {
            status: BOOKMARK_ITEM_STATUS.LEARN,
          }),
        ),
      );
      learnedStatus.current = new Map();
      setActiveCardIdx(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const isFinished = activeCardIdx >= bookmarks.length;
  const learnedPercent = Math.floor(
    (learnedStatus.current.size / bookmarks.length) * 100,
  );

  useEffectOnce(() => {
    queryBookmarks()
      .then((items) => {
        setBookmarks(items);
      })
      .finally(() => {
        setIsLoading(false);
      });
  });

  if (isLoading) {
    return (
      <div className="py-8 w-full max-w-lg mx-auto">
        <UiSkeleton className="h-8 w-full"></UiSkeleton>
        <UiSkeleton className="h-24 w-full mt-8"></UiSkeleton>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="py-8 w-full max-w-lg mx-auto text-center">
        <img src={emptySvg} alt="Empty" />
        <h2 className="mt-4 font-semibold text-2xl">Nothing to Review</h2>
        <p className="text-muted-foreground mt-2">
          Bookmark an item or set bookmark status to &quot;To learn&quot;
        </p>
        <UiButton variant="outline" size="lg" className="w-full mt-16" asChild>
          <Link to="/">Back to Dashboard</Link>
        </UiButton>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-full flex flex-col max-w-lg px-4 gap-8 w-full overflow-hidden py-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <XIcon />
          </Link>
          <UiProgress
            value={((activeCardIdx + 1) / bookmarks.length) * 100}
            className="flex-grow"
          />
          <p className="tabular-nums text-muted-foreground">
            {Math.min(activeCardIdx + 1, bookmarks.length)}/{bookmarks.length}
          </p>
        </div>
        {isFinished && (
          <div className="mt-16">
            <div className="flex items-center justify-center">
              <svg
                width="200"
                height="200"
                viewBox="-25 -25 250 250"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <circle
                  r="90"
                  cx="100"
                  cy="100"
                  className="text-muted"
                  fill="transparent"
                  strokeWidth="14px"
                  strokeDashoffset="0"
                  stroke="currentColor"
                  strokeDasharray="566"
                ></circle>
                <circle
                  r="90"
                  cx="100"
                  cy="100"
                  strokeWidth="14px"
                  fill="transparent"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray="566"
                  className="text-emerald-400"
                  strokeDashoffset={566 - (learnedPercent / 100) * 566}
                ></circle>
              </svg>
              <p className="absolute text-4xl font-semibold">
                {learnedPercent === 100 ? (
                  <CheckIcon className="h-16 w-16" />
                ) : (
                  `${learnedPercent}%`
                )}
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <div className="w-6/12 border rounded-lg text-amber-600 dark:text-amber-400 text-center py-6">
                <p className="text-2xl font-semibold">
                  {bookmarks.length - learnedStatus.current.size}
                </p>
                <p>Still Learning</p>
              </div>
              <div className="w-6/12 border rounded-lg text-emerald-600 dark:text-emerald-400 text-center py-6">
                <p className="text-2xl font-semibold">
                  {learnedStatus.current.size}
                </p>
                <p>Learned</p>
              </div>
            </div>
            <div className="mt-36">
              {learnedPercent < 100 && (
                <UiButton size="lg" className="w-full" onClick={keepReviewing}>
                  Keep Reviewing
                </UiButton>
              )}
              <UiButton
                size="lg"
                variant="outline"
                className="w-full mt-4"
                onClick={restartFlashcards}
              >
                Restart Flashcards
              </UiButton>
            </div>
          </div>
        )}
        {bookmarks.length > 0 && !isFinished && (
          <FlashcardDecks
            cards={bookmarks}
            activeIndex={activeCardIdx}
            onChangeIdx={updateCardIndex}
          />
        )}
      </div>
    </div>
  );
}

export default FlashcardsPage;
