// Generic row-based repository over a single Google Sheets tab.
// Rows are typed as Record<string, unknown> on the wire and coerced to
// strongly-typed entities by the per-entity repo (see ./repos/*).
//
// Conventions:
// - Column A holds `id`. Updates/soft-deletes locate the row by matching id.
// - Booleans serialise as "TRUE"/"FALSE"; numbers serialise via String().
// - `status` columns (where present) are used for soft delete by setting
//   them to "Inactive"/"Cancelled".

import { TabSchema } from "./schema";
import { columnLetter, ensureBootstrap, sheets, SHEET_ID } from "./client";

export type Row = Record<string, string>;

function rowToObj(headers: string[], row: string[]): Row {
  const o: Row = {};
  headers.forEach((h, i) => { o[h] = row[i] ?? ""; });
  return o;
}

function objToRow(headers: string[], obj: Record<string, unknown>): string[] {
  return headers.map(h => {
    const v = obj[h];
    if (v === undefined || v === null) return "";
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return String(v);
  });
}

export class SheetRepo {
  constructor(private tab: TabSchema) {}

  private range(rowsFromHeader?: number) {
    const last = columnLetter(this.tab.headers.length);
    return rowsFromHeader
      ? `${this.tab.name}!A2:${last}${rowsFromHeader + 1}`
      : `${this.tab.name}!A2:${last}`;
  }

  async listRaw(): Promise<Row[]> {
    await ensureBootstrap();
    const res = await sheets().spreadsheets.values.get({
      spreadsheetId: SHEET_ID(),
      range: this.range()
    });
    const values = (res.data.values ?? []) as string[][];
    return values
      .filter(r => r.length > 0 && r.some(c => c !== ""))
      .map(r => rowToObj(this.tab.headers, r));
  }

  async findRowIndex(id: string): Promise<number | null> {
    // 1-based row index in the sheet (1 = header), so first data row is 2.
    const rows = await this.listRaw();
    const idx = rows.findIndex(r => r.id === id);
    return idx === -1 ? null : idx + 2;
  }

  async insert(obj: Record<string, unknown>): Promise<void> {
    await ensureBootstrap();
    const values = [objToRow(this.tab.headers, obj)];
    await sheets().spreadsheets.values.append({
      spreadsheetId: SHEET_ID(),
      range: `${this.tab.name}!A2`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values }
    });
  }

  async updateById(id: string, patch: Record<string, unknown>): Promise<boolean> {
    const rows = await this.listRaw();
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const current = rows[idx];
    const merged = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    const rowNum = idx + 2;
    const last = columnLetter(this.tab.headers.length);
    await sheets().spreadsheets.values.update({
      spreadsheetId: SHEET_ID(),
      range: `${this.tab.name}!A${rowNum}:${last}${rowNum}`,
      valueInputOption: "RAW",
      requestBody: { values: [objToRow(this.tab.headers, merged)] }
    });
    return true;
  }

  /** Soft delete by writing a status column. Falls back to noop if absent. */
  async softDelete(id: string, statusValue = "Inactive"): Promise<boolean> {
    if (!this.tab.headers.includes("status")) return false;
    return this.updateById(id, { status: statusValue });
  }
}
