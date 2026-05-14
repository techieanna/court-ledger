"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, MonthPicker, Field, Empty, currentMonth, money } from "@/components/ui";
import type { BalanceRow } from "@/lib/calc/balances";

export default function PublicBalance() {
  const sp = useSearchParams();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [memberId, setMemberId] = useState(sp.get("memberId") || "");
  const [balance, setBalance] = useState<BalanceRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true); setError(null);
    fetch(`/api/public/balance?memberId=${encodeURIComponent(memberId)}&month=${month}`)
      .then(r => r.json())
      .then(d => {
        if (!d.found) { setBalance(null); setError("Member not found or inactive."); }
        else setBalance(d.balance);
      })
      .finally(() => setLoading(false));
  }, [memberId, month]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = (new FormData(e.currentTarget).get("memberId") as string).trim();
    setMemberId(id);
    router.replace(`/p/balance?memberId=${encodeURIComponent(id)}`);
  };

  return (
    <>
      <PageHeader title="My balance"
        subtitle="Enter the member link the admin shared with you"
        right={<MonthPicker value={month} onChange={setMonth} />} />

      <form onSubmit={submit} className="card max-w-md mb-4">
        <Field label="Member ID">
          <input name="memberId" defaultValue={memberId} className="input" placeholder="paste your member id" />
        </Field>
        <button className="btn-primary mt-3">View balance</button>
      </form>

      {loading && <Empty message="Loading…" />}
      {error && <Empty message={error} />}
      {balance && (
        <div className="card space-y-2">
          <h2 className="text-lg font-semibold">{balance.fullName}</h2>
          <p className="text-xs text-slate-500">Playing days: {balance.configuredDays || "—"}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Stat label="Sessions booked" value={String(balance.sessionsBooked)} />
            <Stat label="Sessions attended" value={String(balance.sessionsAttended)} hint="Informational only" />
            <Stat label="Court cost share" value={money(balance.courtCostShare)} />
            <Stat label="Shared cost share" value={money(balance.sharedCostShare)} />
            <Stat label="Total owed" value={money(balance.totalOwed)} />
            <Stat label="Advance balance (before)" value={money(balance.advanceBalanceBefore)} />
            <Stat label="Advance used" value={money(balance.advanceUsed)} />
            <Stat label="Paid this month" value={money(balance.amountPaid)} />
          </div>
          <div className="mt-4 p-3 rounded-lg border bg-slate-50">
            <div className="text-sm">Outstanding balance</div>
            <div className={`text-2xl font-semibold ${balance.outstandingBalance > 0 ? "text-red-600" : "text-emerald-700"}`}>
              {money(balance.outstandingBalance)}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Charges are based on reserved playing slots rather than attendance.
          </p>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
