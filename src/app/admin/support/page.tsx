"use client";
import { useEffect, useState } from "react";
import { PageHeader, Empty } from "@/components/ui";
import type { SupportQuery } from "@/types";

export default function SupportAdminPage() {
  const [items, setItems] = useState<SupportQuery[]>([]);
  const load = async () => {
    const r = await fetch("/api/admin/support").then(x => x.json());
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: SupportQuery["status"]) => {
    await fetch(`/api/admin/support?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  };

  return (
    <>
      <PageHeader title="Support queries"
        subtitle="Messages sent by members from the public Contact Admin form" />
      {items.length === 0 ? <Empty message="No queries yet." /> : (
        <ul className="space-y-3">
          {items.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(q => (
            <li key={q.id} className="card">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">{q.memberName}
                    <span className="ml-2 badge bg-slate-100 text-slate-700">{q.status}</span>
                  </div>
                  <div className="text-xs text-slate-500">{q.contact}</div>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{q.message}</p>
                  <div className="text-xs text-slate-400 mt-2">{q.createdAt}</div>
                </div>
                <div>
                  {q.status === "Open" ? (
                    <button className="btn-primary" onClick={() => resolve(q.id, "Resolved")}>Mark resolved</button>
                  ) : (
                    <button className="btn-secondary" onClick={() => resolve(q.id, "Open")}>Reopen</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
