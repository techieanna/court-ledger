// Public read-only: monthly bookings calendar. No auth.

import { NextRequest } from "next/server";
import { safePublic } from "@/lib/api";
import { Bookings } from "@/lib/sheets/repos";

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month")
    || new Date().toISOString().slice(0, 7);
  return safePublic(async () => ({
    month, items: await Bookings.listByMonth(month)
  }));
}
