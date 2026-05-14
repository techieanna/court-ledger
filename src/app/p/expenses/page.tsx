"use client";
import { useEffect, useState } from "react";
import { PageHeader, MonthPicker, Empty, currentMonth, money } from "@/components/ui";

interface PubExpense {
  date: string; expenseType: string; amount: number;
  description: string; allocationType: string;
}

export default function PublicExpenses() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<{ items: PubExpense[]; total: number; totalsByType: Record<string, number> } | null>(null);
  useEffect(() => {
    fetch(`/api/public/expenses?month=${month}`).then(r => r.json()).then(setData);
  }, [month]);

  return (
    <>
      <PageHeader title="Group expenses" subtitle={`Costs incurred in ${month}`}
        right={<MonthPicker value={month} onChange={setMonth} />} />
      {!data ? <Empty message="Loading…" /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="card"><div className="text-xs text-slate-500">Total</div>
              <div className="text-2xl font-semibold">{money(data.total)}</div></div>
            <div className="card sm:col-span-2">
              <div className="text-xs text-slate-500 mb-1">By category</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.totalsByType).map(([t, v]) => (
                  <span key={t} className="badge bg-slate-100 text-slate-700">{t}: {money(v)}</span>
                ))}
                {Object.keys(data.totalsByType).length === 0 && (
                  <span className="text-sm text-slate-500">No expenses.</span>
                )}
              </div>
            </div>
          </div>
          {data.items.length === 0 ? <Empty message="No expenses." /> :
            <div className="table-wrap">
              <table className="w-full">
                <thead><tr>
                  <th className="th">Date</th><th className="th">Type</th>
                  <th className="th">Amount</th><th className="th">Description</th>
                </tr></thead>
                <tbody>
                  {data.items.map((e, i) => (
                    <tr key={i}>
                      <td className="td">{e.date}</td>
                      <td className="td">{e.expenseType}</td>
                      <td className="td font-medium">{money(e.amount)}</td>
                      <td className="td text-slate-600 text-sm">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </>
      )}
    </>
  );
}
