// Cost distribution engine.
//
// Financial model: members are charged based on RESERVED PLAYING SLOTS, not
// actual attendance.
//   * Court booking expenses (and any cost linked to a session) split equally
//     across active members whose assignedPlayingDays includes the booking's
//     weekday. Cancelled bookings are excluded.
//   * Shared expenses split either across all active members (AllMembers) or
//     across members assigned to one of the listed weekdays (WeekdayGroup).
//
// Attendance is informational only and never reduces a charge.

import {
  Member, Booking, Expense, Payment, Weekday
} from "@/types";

export interface BalanceRow {
  memberId: string;
  fullName: string;
  configuredDays: string;
  sessionsBooked: number;
  sessionsAttended: number;
  courtCostShare: number;
  sharedCostShare: number;
  totalOwed: number;
  advanceBalanceBefore: number;
  advanceUsed: number;
  amountPaid: number;        // settlement payments this month
  outstandingBalance: number; // positive = owes; negative = credit
}

function memberDays(m: Member): Set<Weekday> {
  return new Set(
    m.assignedPlayingDays
      .split(",")
      .map(s => s.trim())
      .filter(Boolean) as Weekday[]
  );
}

export interface ComputeInput {
  month: string;
  members: Member[];                       // active members only
  bookings: Booking[];                     // confirmed/cancelled, filtered to month
  expenses: Expense[];                     // filtered to month
  payments: Payment[];                     // filtered to month
  attendanceCountByMember: Map<string, number>;
}

export function computeMonthlyBalances(input: ComputeInput): BalanceRow[] {
  const { members, bookings, expenses, payments, attendanceCountByMember } = input;

  const memberById = new Map(members.map(m => [m.id, m]));
  const daysByMember = new Map(members.map(m => [m.id, memberDays(m)]));

  const init = (m: Member): BalanceRow => ({
    memberId: m.id,
    fullName: m.fullName,
    configuredDays: m.assignedPlayingDays,
    sessionsBooked: 0,
    sessionsAttended: attendanceCountByMember.get(m.id) || 0,
    courtCostShare: 0,
    sharedCostShare: 0,
    totalOwed: 0,
    advanceBalanceBefore: m.advanceBalance,
    advanceUsed: 0,
    amountPaid: 0,
    outstandingBalance: 0
  });

  const result = new Map<string, BalanceRow>(members.map(m => [m.id, init(m)]));

  // 1. Bookings drive sessionsBooked per member (slots reserved by weekday)
  const activeBookings = bookings.filter(b => b.status !== "Cancelled");
  for (const b of activeBookings) {
    for (const m of members) {
      if (daysByMember.get(m.id)?.has(b.weekday)) {
        result.get(m.id)!.sessionsBooked += 1;
      }
    }
  }

  // 2. Expenses — court / session-linked vs shared
  // Court Booking expenses (or any expense linked to a session) are split
  // among members responsible for that weekday. To find the weekday we use
  // either expense.date or the linked booking's date.
  const weekdayByDate = (iso: string): Weekday => {
    const d = new Date(iso + "T00:00:00Z");
    const names: Weekday[] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return names[d.getUTCDay()];
  };

  for (const e of expenses) {
    const isCourt = e.expenseType === "Court Booking" || !!e.linkedSessionId;
    if (isCourt) {
      const weekday = weekdayByDate(e.date);
      const responsible = members.filter(m => daysByMember.get(m.id)?.has(weekday));
      if (responsible.length === 0) continue;
      const share = e.amount / responsible.length;
      for (const m of responsible) result.get(m.id)!.courtCostShare += share;
    } else if (e.allocationType === "WeekdayGroup" && e.allocationWeekdays) {
      const days = new Set(
        e.allocationWeekdays.split(",").map(s => s.trim()).filter(Boolean) as Weekday[]
      );
      const responsible = members.filter(m => {
        const md = daysByMember.get(m.id)!;
        for (const d of days) if (md.has(d)) return true;
        return false;
      });
      if (responsible.length === 0) continue;
      const share = e.amount / responsible.length;
      for (const m of responsible) result.get(m.id)!.sharedCostShare += share;
    } else {
      // AllMembers
      if (members.length === 0) continue;
      const share = e.amount / members.length;
      for (const m of members) result.get(m.id)!.sharedCostShare += share;
    }
  }

  // 3. Payments this month
  for (const p of payments) {
    const r = result.get(p.memberId);
    if (!r) continue;
    if (p.paymentType === "Settlement") r.amountPaid += p.amount;
    // Advance / Refund / Adjustment are reflected on the member.advanceBalance
    // by the API handler that records them; not double-counted here.
  }

  // 4. Totals + advance usage
  for (const r of result.values()) {
    r.totalOwed = round2(r.courtCostShare + r.sharedCostShare);
    const owedAfterPayments = r.totalOwed - r.amountPaid;
    if (owedAfterPayments > 0 && r.advanceBalanceBefore > 0) {
      r.advanceUsed = Math.min(owedAfterPayments, r.advanceBalanceBefore);
    }
    r.outstandingBalance = round2(owedAfterPayments - r.advanceUsed);
    r.courtCostShare = round2(r.courtCostShare);
    r.sharedCostShare = round2(r.sharedCostShare);
    r.advanceUsed = round2(r.advanceUsed);
  }

  return Array.from(result.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));

  function round2(n: number) { return Math.round(n * 100) / 100; }
}
