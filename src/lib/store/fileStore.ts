// File-based table store: one JSON file per tab under ./data/.
// Use only for local development; not safe under concurrent serverless writes.

import { promises as fs } from "fs";
import path from "path";
import { TableStore, Row } from "./types";
import { TabSchema } from "../sheets/schema";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(tab: TabSchema) {
  return path.join(DATA_DIR, `${tab.name}.json`);
}

async function readAll(tab: TabSchema): Promise<Row[]> {
  await ensureDir();
  try {
    const buf = await fs.readFile(filePath(tab), "utf8");
    const parsed = JSON.parse(buf);
    return Array.isArray(parsed) ? (parsed as Row[]) : [];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(tab: TabSchema, rows: Row[]) {
  await ensureDir();
  await fs.writeFile(filePath(tab), JSON.stringify(rows, null, 2), "utf8");
}

function normalize(headers: string[], obj: Record<string, unknown>): Row {
  const out: Row = {};
  for (const h of headers) {
    const v = obj[h];
    if (v === undefined || v === null) out[h] = "";
    else if (typeof v === "boolean") out[h] = v ? "TRUE" : "FALSE";
    else out[h] = String(v);
  }
  return out;
}

export class FileTableStore implements TableStore {
  constructor(private tab: TabSchema) {}

  async listRaw(): Promise<Row[]> {
    return readAll(this.tab);
  }

  async insert(obj: object): Promise<void> {
    const rows = await readAll(this.tab);
    rows.push(normalize(this.tab.headers, obj as Record<string, unknown>));
    await writeAll(this.tab, rows);
  }

  async updateById(id: string, patch: object): Promise<boolean> {
    const rows = await readAll(this.tab);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const merged = { ...rows[idx], ...(patch as Record<string, unknown>), id, updatedAt: new Date().toISOString() };
    rows[idx] = normalize(this.tab.headers, merged);
    await writeAll(this.tab, rows);
    return true;
  }

  async softDelete(id: string, statusValue = "Inactive"): Promise<boolean> {
    if (!this.tab.headers.includes("status")) return false;
    return this.updateById(id, { status: statusValue });
  }
}
