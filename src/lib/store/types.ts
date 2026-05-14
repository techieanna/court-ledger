// Common contract for a single "table" in any backend.
// Both SheetRepo and FileTableStore implement this; the repos/index.ts
// factory picks the right one based on DATA_BACKEND.

export type Row = Record<string, string>;

export interface TableStore {
  listRaw(): Promise<Row[]>;
  insert(obj: object): Promise<void>;
  updateById(id: string, patch: object): Promise<boolean>;
  /** Soft delete by writing the `status` column (if present). */
  softDelete(id: string, statusValue?: string): Promise<boolean>;
}
