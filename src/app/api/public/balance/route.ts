// Per-member read-only balance lookup. Members access via shareable URL
// containing their memberId (not secret-grade, but acceptable for MVP).

import { NextRequest } from "next/server";
import { safePublic } from "@/lib/api";
import {
  Bookings, Expenses, Members, Payments, ParticipationRepo, Sessions
} from "@/lib/sheets/repos";
import { computeMonthlyBalances } from "@/lib/calc/balances";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  return safePublic(async () => {
    if (!memberId) throw new Error("memberId required");
    const [members, bookings, expenses, payments, sessions] = await Promise.all([
      Members.list(false),
      Bookings.listByMonth(month),
      Expenses.listByMonth(month),
      Payments.listByMonth(month),
      Sessions.list()
    ]);
    const sessionDates = new Map(sessions.map(s => [s.id, s.date]));
    const parts = await ParticipationRepo.listByMonth(month, sessionDates);
    const attMap = new Map<string, number>();
    for (const p of parts) if (p.attended) attMap.set(p.memberId, (attMap.get(p.memberId) || 0) + 1);

    const rows = computeMonthlyBalances({
      month, members, bookings, expenses, payments,
      attendanceCountByMember: attMap
    });
    const row = rows.find(r => r.memberId === memberId);
    if (!row) return { month, found: false };
    return { month, found: true, balance: row };
  });
}
