"use client";
import { useEffect, useState } from "react";
import { PageHeader, MonthPicker, Field, currentMonth, money, Empty } from "@/components/ui";
import type { Member, Payment, PaymentType } from "@/types";

const TYPES: PaymentType[] = ["Advance", "Settlement", "Refund", "Adjustment"];

export default function PaymentsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adding, setAdding] = useState<Partial<Payment> | null>(null);

  const load = async () => {
    const [m, p] = await Promise.all([
      fetch("/api/admin/members").then(r => r.json()),
      fetch("/api/admin/payments").then(r => r.json())
    ]);
    setMembers((m.items || []).filter((x: Member) => x.status === "Active"));
    setPayments(p.items || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!adding) return;
    await fetch("/api/admin/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adding)
    });
    setAdding(null);
    await load();
  };

  const monthPayments = payments.filter(p => p.paymentDate.startsWith(month));
  const monthTotal = monthPayments.reduce((s, p) => s + p.amount, 0);
  const advanceTotal = members.reduce((s, m) => s + m.advanceBalance, 0);

  return (
    <>
      <PageHeader
        title="Payments & balances"
        subtitle="Record advance payments and monthly settlements"
        right={
          <div className="flex gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <button className="btn-primary" onClick={() => setAdding({
              paymentDate: new Date().toISOString().slice(0, 10),
              paymentType: "Settlement", amount: 0
            })}>Record payment</button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div className="card"><div className="text-xs text-slate-500">Advance balances held</div>
          <div className="text-2xl font-semibold">{money(advanceTotal)}</div></div>
        <div className="card"><div className="text-xs text-slate-500">Payments this month</div>
          <div className="text-2xl font-semibold">{money(monthTotal)}</div></div>
        <div className="card"><div className="text-xs text-slate-500">Active members</div>
          <div className="text-2xl font-semibold">{members.length}</div></div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Members</h2>
      <div className="table-wrap mb-6">
        <table className="w-full">
          <thead><tr>
            <th className="th">Name</th><th className="th">Advance balance</th>
            <th className="th">Phone</th><th className="th">Days</th>
          </tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td className="td font-medium">{m.fullName}</td>
                <td className="td">{money(m.advanceBalance)}</td>
                <td className="td text-xs text-slate-600">{m.phone}</td>
                <td className="td text-xs text-slate-500">{m.assignedPlayingDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-2">Recent payments</h2>
      {payments.length === 0 ? <Empty message="No payments recorded yet." /> : (
        <div className="table-wrap">
          <table className="w-full">
            <thead><tr>
              <th className="th">Date</th><th className="th">Member</th>
              <th className="th">Type</th><th className="th">Amount</th><th className="th">Notes</th>
            </tr></thead>
            <tbody>
              {payments.slice().sort((a,b) => b.paymentDate.localeCompare(a.paymentDate)).map(p => {
                const m = members.find(x => x.id === p.memberId);
                return (
                  <tr key={p.id}>
                    <td className="td">{p.paymentDate}</td>
                    <td className="td">{m?.fullName || p.memberId}</td>
                    <td className="td"><span className="badge bg-slate-100 text-slate-700">{p.paymentType}</span></td>
                    <td className="td font-medium">{money(p.amount)}</td>
                    <td className="td text-xs text-slate-600">{p.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setAdding(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Record payment</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Member">
                <select className="input" value={adding.memberId || ""}
                  onChange={e => setAdding({ ...adding, memberId: e.target.value })}>
                  <option value="">— select —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </select>
              </Field>
              <Field label="Date">
                <input className="input" type="date" value={adding.paymentDate || ""}
                  onChange={e => setAdding({ ...adding, paymentDate: e.target.value })}/>
              </Field>
              <Field label="Type">
                <select className="input" value={adding.paymentType || "Settlement"}
                  onChange={e => setAdding({ ...adding, paymentType: e.target.value as PaymentType })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Amount">
                <input className="input" type="number" step="0.01" value={adding.amount ?? 0}
                  onChange={e => setAdding({ ...adding, amount: Number(e.target.value) })}/>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Notes">
                <textarea className="input" rows={2} value={adding.notes || ""}
                  onChange={e => setAdding({ ...adding, notes: e.target.value })}/>
              </Field>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Advance and Refund payments automatically adjust the member&apos;s advance balance.
              Use Adjustment + advanceDelta only via API for corrections.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}
                disabled={!adding.memberId || !adding.amount}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
