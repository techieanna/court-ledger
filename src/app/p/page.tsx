"use client";
import { useEffect, useState } from "react";
import { PageHeader, MonthPicker, Empty, currentMonth } from "@/components/ui";
import type { Booking } from "@/types";

export default function PublicCalendar() {
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/calendar?month=${month}`).then(r => r.json()).then(d => {
      setItems(d.items || []); setLoading(false);
    });
  }, [month]);

  return (
    <>
      <PageHeader title="Bookings" subtitle={`Court bookings for ${month}`}
        right={<MonthPicker value={month} onChange={setMonth} />} />
      {loading ? <Empty message="Loading…" /> :
        items.length === 0 ? <Empty message="No bookings this month." /> :
        <ul className="grid sm:grid-cols-2 gap-3">
          {items.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(b => (
            <li key={b.id} className={`card ${b.status === "Cancelled" ? "opacity-60" : ""}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{b.date} · {b.weekday}</div>
                  <div className="text-sm text-slate-600">{b.startTime}–{b.endTime}</div>
                </div>
                <span className={`badge ${
                  b.status === "Cancelled" ? "bg-red-100 text-red-700" :
                  b.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-emerald-100 text-emerald-700"
                }`}>{b.status}</span>
              </div>
              <div className="mt-2 text-sm">{b.venueName || "Venue TBC"}</div>
              <div className="text-xs text-slate-500">{b.courtsBooked} court{b.courtsBooked === 1 ? "" : "s"}</div>
              {b.notes && <div className="text-xs text-slate-500 mt-1">{b.notes}</div>}
            </li>
          ))}
        </ul>
      }
    </>
  );
}
