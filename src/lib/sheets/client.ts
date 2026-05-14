// Google Sheets API client + bootstrap.
// Builds a singleton authenticated client and ensures all required tabs and
// header rows exist before any read/write. This file is the only place that
// talks to googleapis directly.

import { google, sheets_v4 } from "googleapis";
import { ALL_TABS, TabSchema } from "./schema";

let sheetsClient: sheets_v4.Sheets | null = null;
let bootstrapped = false;
let bootstrapPromise: Promise<void> | null = null;

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  return id;
}

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set"
    );
  }
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
}

export function sheets(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

export const SHEET_ID = () => spreadsheetId();

/** Ensure every required tab exists and the first row matches header schema. */
export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = doBootstrap()
    .then(() => { bootstrapped = true; })
    .finally(() => { bootstrapPromise = null; });
  return bootstrapPromise;
}

async function doBootstrap() {
  const api = sheets();
  const meta = await api.spreadsheets.get({ spreadsheetId: spreadsheetId() });
  const existing = new Set(
    (meta.data.sheets ?? []).map(s => s.properties?.title).filter(Boolean) as string[]
  );

  const toAdd = ALL_TABS.filter(t => !existing.has(t.name));
  if (toAdd.length > 0) {
    await api.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: {
        requests: toAdd.map(t => ({ addSheet: { properties: { title: t.name } } }))
      }
    });
  }
  // Write/refresh header rows for every tab
  await api.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      valueInputOption: "RAW",
      data: ALL_TABS.map((t: TabSchema) => ({
        range: `${t.name}!A1:${columnLetter(t.headers.length)}1`,
        values: [t.headers]
      }))
    }
  });
}

export function columnLetter(colIndex1Based: number): string {
  let n = colIndex1Based;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
