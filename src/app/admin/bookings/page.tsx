"use client";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, MonthPicker, Field, currentMonth } from "@/components/ui";
import { WEEKDAYS } from "@/types";
import type { Booking, Weekday } from "@/types";

const WEEK_ORDER: Weekday[] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function buildCalendar(month: string): (Date | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startOffset = first.getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(y, m - 1, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const blank = (date: string): Partial<Booking> => ({
  date, weekday: weekdayOf(date),
  startTime: "19:00", endTime: "21:00",
  venueName: "", courtsBooked: 2,
  status: "Confirmed", notes: ""
});

function weekdayOf(iso: string): Weekday {
  return WEEK_ORDER[new Date(iso + "T00:00:00Z").getUTCDay()];
}

export default function BookingsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<Booking[]>([]);
  const [editing, setEditing] = useState<Partial<Booking> | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/bookings?month=${month}`).then(r => r.json());
    setItems(res.items || []);
  };
  useEffect(() => { load(); }, [month]);

  const byDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of items) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return m;
  }, [items]);

  const save = async () => {
    if (!editing) return;
    const method = editing.id ? "PATCH" : "POST";
    const url = editing.id ? `/api/admin/bookings?id=${editing.id}` : `/api/admin/bookings`;
    await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, weekday: editing.date ? weekdayOf(editing.date) : editing.weekday })
    });
    setEditing(null);
    await load();
  };

  const cancel = async () => {
    if (!editing?.id) return;
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/admin/bookings?id=${editing.id}`, { method: "DELETE" });
    setEditing(null);
    await load();
  };

  const cells = buildCalendar(month);

  return (
    <>
      <PageHeader
        title="Bookings calendar"
        subtitle="Add and manage court bookings by month"
        right={
          <div className="flex gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <button className="btn-primary" onClick={() => setEditing(blank(`${month}-01`))}>
              Add booking
            </button>
          </div>
        }
      />

      <div className="card">
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
          {WEEK_ORDER.map(d => (
            <div key={d} className="bg-slate-50 text-xs font-medium text-slate-600 px-2 py-1 text-center">
              {d.slice(0,3)}
            </div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={i} className="bg-slate-50 h-24" />;
            const iso = c.toISOString().slice(0, 10);
            const list = byDate.get(iso) || [];
            return (
              <button
                key={i}
                onClick={() => setEditing(blank(iso))}
                className="bg-white h-24 p-2 text-left hover:bg-brand-50 transition"
              >
                <div className="text-xs text-slate-500">{c.getUTCDate()}</div>
                <div className="mt-1 space-y-1">
                  {list.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); setEditing(b); }}
                      className={`text-[11px] truncate rounded px-1.5 py-0.5 cursor-pointer ${
                        b.status === "Cancelled" ? "bg-red-100 text-red-700 line-through" :
                        b.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {b.startTime} · {b.courtsBooked}c
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">{editing.id ? "Edit booking" : "Add booking"}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Date">
                <input className="input" type="date" value={editing.date || ""}
                  onChange={e => setEditing({ ...editing, date: e.target.value })}/>
              </Field>
              <Field label="Weekday">
                <input className="input" disabled value={editing.date ? weekdayOf(editing.date) : ""} />
              </Field>
              <Field label="Start time">
                <input className="input" type="time" value={editing.startTime || ""}
                  onChange={e => setEditing({ ...editing, startTime: e.target.value })}/>
              </Field>
              <Field label="End time">
                <input className="input" type="time" value={editing.endTime || ""}
                  onChange={e => setEditing({ ...editing, endTime: e.target.value })}/>
              </Field>
              <Field label="Venue">
                <input className="input" value={editing.venueName || ""}
                  onChange={e => setEditing({ ...editing, venueName: e.target.value })}/>
              </Field>
              <Field label="Courts booked">
                <input className="input" type="number" min={1} value={editing.courtsBooked || 1}
                  onChange={e => setEditing({ ...editing, courtsBooked: Number(e.target.value) })}/>
              </Field>
              <Field label="Status">
                <select className="input" value={editing.status || "Confirmed"}
                  onChange={e => setEditing({ ...editing, status: e.target.value as Booking["status"] })}>
                  <option>Confirmed</option><option>Pending</option><option>Cancelled</option>
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Notes">
                <textarea className="input" rows={2} value={editing.notes || ""}
                  onChange={e => setEditing({ ...editing, notes: e.target.value })}/>
              </Field>
            </div>
            <div className="flex justify-between mt-5">
              <div>
                {editing.id && (
                  <button className="btn-danger" onClick={cancel}>Cancel booking</button>
                )}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setEditing(null)}>Close</button>
                <button className="btn-primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-3">
        Weekdays used here: {WEEKDAYS.join(", ")}.
      </p>
    </>
  );
}
