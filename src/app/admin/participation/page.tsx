"use client";
// Participation is informational only and never affects charges.
import { useEffect, useState } from "react";
import { PageHeader, MonthPicker, currentMonth, Empty } from "@/components/ui";
import type { Booking, Member, Participation } from "@/types";

type SessionLite = { id: string; bookingId: string; date: string; weekday: string };

export default function ParticipationPage() {
  const [month, setMonth] = useState(currentMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [selected, setSelected] = useState<SessionLite | null>(null);
  const [attended, setAttended] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [b, m, s] = await Promise.all([
        fetch(`/api/admin/bookings?month=${month}`).then(r => r.json()),
        fetch(`/api/admin/members`).then(r => r.json()),
        fetch(`/api/admin/sessions`).then(r => r.json())
      ]);
      setBookings((b.items || []).filter((x: Booking) => x.status !== "Cancelled"));
      setMembers((m.items || []).filter((x: Member) => x.status === "Active"));
      setSessions((s.items || []).filter((x: SessionLite) => x.date.startsWith(month)));
    })();
  }, [month]);

  const ensureSession = async (booking: Booking): Promise<SessionLite> => {
    const existing = sessions.find(s => s.bookingId === booking.id);
    if (existing) return existing;
    const created = await fetch("/api/admin/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id, date: booking.date,
        weekday: booking.weekday, status: "Scheduled"
      })
    }).then(r => r.json());
    setSessions(prev => [...prev, created]);
    return created;
  };

  const openBooking = async (b: Booking) => {
    const session = await ensureSession(b);
    setSelected(session);
    const res = await fetch(`/api/admin/participation?sessionId=${session.id}`).then(r => r.json());
    const map: Record<string, boolean> = {};
    (res.items as Participation[] || []).forEach(p => { map[p.memberId] = p.attended; });
    setAttended(map);
  };

  const save = async () => {
    if (!selected) return;
    const entries = Object.entries(attended).map(([memberId, a]) => ({ memberId, attended: a }));
    await fetch("/api/admin/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selected.id, entries })
    });
    alert("Saved.");
  };

  const total = Object.values(attended).filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Participation"
        subtitle="Informational only. Attendance does not affect charges."
        right={<MonthPicker value={month} onChange={setMonth} />}
      />
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-2">Bookings ({month})</h2>
          {bookings.length === 0 ? <Empty message="No active bookings." /> :
            <ul className="space-y-2">
              {bookings.map(b => (
                <li key={b.id}>
                  <button onClick={() => openBooking(b)}
                    className={`w-full text-left p-3 rounded-lg border ${selected?.bookingId === b.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <div className="text-sm font-medium">{b.date} · {b.weekday}</div>
                    <div className="text-xs text-slate-500">{b.startTime}–{b.endTime} · {b.venueName || "—"}</div>
                  </button>
                </li>
              ))}
            </ul>
          }
        </div>

        <div className="card md:col-span-2">
          {!selected ? <Empty message="Select a booking to mark attendance." /> : (
            <>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="font-semibold">Mark attendance · {selected.date}</h2>
                  <p className="text-xs text-slate-500">Total marked present: {total}</p>
                </div>
                <button className="btn-primary" onClick={save}>Save participation</button>
              </div>
              <ul className="divide-y">
                {members.map(m => (
                  <li key={m.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">{m.fullName}</div>
                      <div className="text-xs text-slate-500">{m.assignedPlayingDays}</div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!attended[m.id]}
                        onChange={e => setAttended({ ...attended, [m.id]: e.target.checked })}/>
                      <span className="text-sm">Present</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
