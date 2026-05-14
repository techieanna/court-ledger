"use client";
import { useEffect, useState } from "react";
import { PageHeader, StatCard, MonthPicker, currentMonth, money } from "@/components/ui";
import type { BalanceRow } from "@/lib/calc/balances";
import Link from "next/link";

interface Summary { month: string; items: BalanceRow[] }

export default function AdminDashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Summary | null>(null);
  const [bookings, setBookings] = useState<number>(0);
  const [expenseTotal, setExpenseTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const [sumRes, bRes, eRes] = await Promise.all([
        fetch(`/api/admin/summaries?month=${month}`).then(r => r.json()),
        fetch(`/api/admin/bookings?month=${month}`).then(r => r.json()),
        fetch(`/api/admin/expenses?month=${month}`).then(r => r.json())
      ]);
      setData(sumRes);
      setBookings((bRes.items || []).filter((b: { status: string }) => b.status !== "Cancelled").length);
      setExpenseTotal((eRes.items || []).reduce((s: number, e: { amount: number }) => s + (e.amount || 0), 0));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [month]);

  const items = data?.items || [];
  const totalOwed = items.reduce((s, r) => s + r.totalOwed, 0);
  const outstanding = items.reduce((s, r) => s + r.outstandingBalance, 0);
  const advance = items.reduce((s, r) => s + (r.advanceBalanceBefore - r.advanceUsed), 0);
  const activeMembers = items.length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Monthly overview of bookings, costs and balances"
        right={<MonthPicker value={month} onChange={setMonth} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total monthly cost" value={money(expenseTotal)} />
        <StatCard label="Bookings (confirmed)" value={bookings} />
        <StatCard label="Active members" value={activeMembers} />
        <StatCard label="Outstanding balances" value={money(outstanding)} />
        <StatCard label="Advance balances remaining" value={money(advance)} />
        <StatCard label="Total charges this month" value={money(totalOwed)} />
      </div>

      <div className="mt-8 card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Per-member balances ({month})</h2>
          <Link className="btn-secondary" href="/admin/payments">Open payments</Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No data for this month yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Member</th>
                  <th className="th">Days</th>
                  <th className="th">Booked</th>
                  <th className="th">Court £</th>
                  <th className="th">Shared £</th>
                  <th className="th">Owed</th>
                  <th className="th">Advance used</th>
                  <th className="th">Paid</th>
                  <th className="th">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.memberId}>
                    <td className="td font-medium">{r.fullName}</td>
                    <td className="td text-xs text-slate-500">{r.configuredDays}</td>
                    <td className="td">{r.sessionsBooked}</td>
                    <td className="td">{money(r.courtCostShare)}</td>
                    <td className="td">{money(r.sharedCostShare)}</td>
                    <td className="td">{money(r.totalOwed)}</td>
                    <td className="td">{money(r.advanceUsed)}</td>
                    <td className="td">{money(r.amountPaid)}</td>
                    <td className={`td font-medium ${r.outstandingBalance > 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {money(r.outstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">
          Charges reflect reserved playing slots, not attendance.
        </p>
      </div>
    </>
  );
}
