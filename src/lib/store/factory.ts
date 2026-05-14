// Picks a TableStore implementation based on DATA_BACKEND.
//   DATA_BACKEND=file   -> JSON files under ./data/  (default for local dev)
//   DATA_BACKEND=sheets -> Google Sheets             (production / Vercel)

import { TableStore } from "./types";
import { TabSchema } from "../sheets/schema";
import { FileTableStore } from "./fileStore";
import { SheetRepo } from "../sheets/repo";

const backend = (process.env.DATA_BACKEND || "file").toLowerCase();

export function getStore(tab: TabSchema): TableStore {
  if (backend === "sheets") return new SheetRepo(tab);
  return new FileTableStore(tab);
}

export function backendName() {
  return backend;
}
