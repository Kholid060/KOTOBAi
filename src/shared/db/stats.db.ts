import dayjs from 'dayjs';
import Dexie from 'dexie';

export interface StatItem {
  id: string;
  count: number;
}

export const statDateFormat = (date: Date | string) =>
  dayjs(date).format('YYYY-MM-DD');

class StatsDb extends Dexie {
  items!: Dexie.Table<StatItem, StatItem['id']>;

  constructor() {
    super('stats');
    this.version(1).stores({
      items: 'id',
    });
  }

  incrementStat(date: string | Date, by = 1) {
    const id = date instanceof Date ? statDateFormat(date) : date;

    return this.transaction('rw', this.items, async () => {
      const currStat = await this.items.get(id);
      if (!currStat) {
        await this.items.add({ id, count: 1 });
        return;
      }

      await this.items.update(id, {
        count: currStat.count + by,
      });
    });
  }
}

const statsDB = new StatsDb();

export default statsDB;
