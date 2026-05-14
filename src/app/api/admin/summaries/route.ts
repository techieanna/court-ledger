// Generate / fetch monthly balances. GET ?month=YYYY-MM computes live;
// POST ?month=YYYY-MM persists the result into MonthlySummaries.

import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import {
  Bookings, Expenses, Members, Payments, ParticipationRepo, Sessions,
  MonthlySummaries
} from "@/lib/sheets/repos";
import { computeMonthlyBalances } from "@/lib/calc/balances";

async function compute(month: string) {
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
  for (const p of parts) if (p.attended) {
    attMap.set(p.memberId, (attMap.get(p.memberId) || 0) + 1);
  }
  return computeMonthlyBalances({
    month, members, bookings, expenses, payments,
    attendanceCountByMember: attMap
  });
}

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month");
  return withAdmin(async () => {
    if (!month) throw new Error("month required (YYYY-MM)");
    return { month, items: await compute(month) };
  });
}

export async function POST(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month");
  return withAdmin(async () => {
    if (!month) throw new Error("month required (YYYY-MM)");
    const rows = await compute(month);
    await MonthlySummaries.upsert(rows.map(r => ({
      month, memberId: r.memberId,
      configuredDays: r.configuredDays,
      sessionsBooked: r.sessionsBooked,
      sessionsAttended: r.sessionsAttended,
      courtCostShare: r.courtCostShare,
      sharedCostShare: r.sharedCostShare,
      totalOwed: r.totalOwed,
      advanceUsed: r.advanceUsed,
      amountPaid: r.amountPaid,
      outstandingBalance: r.outstandingBalance
    })));
    return { month, persisted: rows.length };
  });
}
