import { useState } from 'react';
import UiCard from '../ui/card';
import { useEffectOnce } from 'usehooks-ts';
import dayjs from 'dayjs';
import statsDB from '@root/src/shared/db/stats.db';
import { cn } from '@root/src/shared/lib/shadcn-utils';

interface StatDate {
  day: string;
  date: number;
  fullDate: string;
  practiceCount: number;
}

const getStatDate = (date: dayjs.Dayjs): StatDate => ({
  practiceCount: 0,
  date: date.get('date'),
  day: date.format('ddd'),
  fullDate: date.format('YYYY-MM-DD'),
});

function DashboardStats(props: React.HTMLAttributes<HTMLDivElement>) {
  const [stats, setStats] = useState<StatDate[]>([]);

  useEffectOnce(() => {
    const MAX_DAYS = 7;

    const today = dayjs();
    Promise.all(
      Array.from({ length: MAX_DAYS }, (_, idx) => {
        const statDate = getStatDate(today.subtract(idx, 'day'));
        return statsDB.items
          .get(statDate.fullDate)
          .then((item) => ({ ...statDate, practiceCount: item?.count ?? 0 }))
          .catch(() => statDate);
      }),
    ).then((dates) => {
      setStats(dates.reverse());
    });
  });

  return (
    <UiCard {...props}>
      <UiCard.Content className="p-4">
        <p className="font-semibold">Practice stats</p>
        <div className="flex justify-between mt-2">
          {stats.map((item) => (
            <div
              key={item.fullDate}
              className="bg-muted/50 text-center rounded-lg w-12"
            >
              <div className="p-1">
                <p
                  className={cn(
                    'bg-muted/50 text-sm rounded-lg border-2 dark:border-0 leading-[38px]',
                    item.practiceCount > 0
                      ? 'bg-primary/30 border-primary/30'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.practiceCount}
                </p>
              </div>
              <div className="pb-2 pt-1">
                <p className="text-muted-foreground text-sm">{item.day}</p>
                <p className="mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </UiCard.Content>
    </UiCard>
  );
}

export default DashboardStats;
