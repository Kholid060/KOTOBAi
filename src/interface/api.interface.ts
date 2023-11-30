export interface DictEntriesReqResult<T> {
  records: T;
  counts: number;
  isLastFile: boolean;
}
