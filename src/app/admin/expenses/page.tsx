"use client";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, MonthPicker, Field, currentMonth, money, Empty } from "@/components/ui";
import { WEEKDAYS } from "@/types";
import type { Expense } from "@/types";

const TYPES: Expense["expenseType"][] = [
  "Court Booking","Shuttle Purchase","Coaching","Tournament Fee","Snacks/Refreshments","Other"
];

const blank = (): Partial<Expense> & { daysList: string[] } => ({
  date: new Date().toISOString().slice(0, 10),
  expenseType: "Court Booking", amount: 0, description: "",
  linkedSessionId: "", allocationType: "AllMembers",
  daysList: []
});

export default function ExpensesPage() {
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<Expense[]>([]);
  const [editing, setEditing] = useState<(Partial<Expense> & { daysList: string[] }) | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/expenses?month=${month}`).then(r => r.json());
    setItems(res.items || []);
  };
  useEffect(() => { load(); }, [month]);

  const totalsByType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of items) m[e.expenseType] = (m[e.expenseType] || 0) + e.amount;
    return m;
  }, [items]);
  const total = items.reduce((s, e) => s + e.amount, 0);

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, allocationWeekdays: editing.daysList };
    const method = editing.id ? "PATCH" : "POST";
    const url = editing.id ? `/api/admin/expenses?id=${editing.id}` : `/api/admin/expenses`;
    await fetch(url, { method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload) });
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Cancel this expense?")) return;
    await fetch(`/api/admin/expenses?id=${id}`, { method: "DELETE" });
    await load();
  };

  const startEdit = (e: Expense) => setEditing({
    ...e, daysList: (e.allocationWeekdays || "").split(",").filter(Boolean)
  });

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Add running costs. Court bookings auto-split by weekday."
        right={
          <div className="flex gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <button className="btn-primary" onClick={() => setEditing(blank())}>Add expense</button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div className="card"><div className="text-xs text-slate-500">Total ({month})</div>
          <div className="text-2xl font-semibold">{money(total)}</div></div>
        <div className="card col-span-2">
          <div className="text-xs text-slate-500 mb-1">By category</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsByType).map(([t, v]) => (
              <span key={t} className="badge bg-slate-100 text-slate-700">{t}: {money(v)}</span>
            ))}
            {Object.keys(totalsByType).length === 0 && <span className="text-sm text-slate-500">No expenses yet</span>}
          </div>
        </div>
      </div>

      {items.length === 0 ? <Empty message="No expenses for this month." /> : (
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Date</th><th className="th">Type</th>
                <th className="th">Amount</th><th className="th">Allocation</th>
                <th className="th">Description</th><th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id}>
                  <td className="td">{e.date}</td>
                  <td className="td">{e.expenseType}</td>
                  <td className="td font-medium">{money(e.amount)}</td>
                  <td className="td text-xs">
                    {e.allocationType}{e.allocationWeekdays ? ` (${e.allocationWeekdays})` : ""}
                  </td>
                  <td className="td text-xs text-slate-600">{e.description}</td>
                  <td className="td text-right">
                    <button className="btn-secondary mr-2" onClick={() => startEdit(e)}>Edit</button>
                    <button className="btn-danger" onClick={() => remove(e.id)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">{editing.id ? "Edit expense" : "Add expense"}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Date">
                <input className="input" type="date" value={editing.date}
                  onChange={e => setEditing({ ...editing, date: e.target.value })}/>
              </Field>
              <Field label="Type">
                <select className="input" value={editing.expenseType}
                  onChange={e => setEditing({ ...editing, expenseType: e.target.value as Expense["expenseType"] })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Amount">
                <input className="input" type="number" step="0.01" value={editing.amount}
                  onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}/>
              </Field>
              <Field label="Linked session id (optional)">
                <input className="input" value={editing.linkedSessionId || ""}
                  onChange={e => setEditing({ ...editing, linkedSessionId: e.target.value })}/>
              </Field>
              <Field label="Allocation">
                <select className="input" value={editing.allocationType}
                  onChange={e => setEditing({ ...editing, allocationType: e.target.value as Expense["allocationType"] })}>
                  <option value="AllMembers">Split across all active members</option>
                  <option value="WeekdayGroup">Split across specific weekday groups</option>
                </select>
              </Field>
              <div />
            </div>
            {editing.allocationType === "WeekdayGroup" && (
              <div className="mt-3">
                <span className="label">Weekdays</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(d => {
                    const active = editing.daysList.includes(d);
                    return (
                      <button key={d} type="button"
                        onClick={() => setEditing({
                          ...editing,
                          daysList: active
                            ? editing.daysList.filter(x => x !== d)
                            : [...editing.daysList, d]
                        })}
                        className={`badge cursor-pointer ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-3">
              <Field label="Description">
                <textarea className="input" rows={2} value={editing.description || ""}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}/>
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-secondary" onClick={() => setEditing(null)}>Close</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-4">
        Court Booking expenses and any expense linked to a session split equally across members
        whose playing days include the expense&apos;s weekday — independent of attendance.
      </p>
    </>
  );
}
