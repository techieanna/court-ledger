"use client";
import { useEffect, useState } from "react";
import { PageHeader, Field, Empty, money } from "@/components/ui";
import { WEEKDAYS } from "@/types";
import type { Member } from "@/types";

const empty = (): Partial<Member> & { daysList: string[] } => ({
  fullName: "", phone: "", email: "", whatsappNumber: "",
  daysList: [], status: "Active", advanceBalance: 0, notes: ""
});

export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Partial<Member> & { daysList: string[] }) | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/members").then(r => r.json());
    setItems(res.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, assignedPlayingDays: editing.daysList };
    const method = editing.id ? "PATCH" : "POST";
    const url = editing.id ? `/api/admin/members?id=${editing.id}` : `/api/admin/members`;
    await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Deactivate this member?")) return;
    await fetch(`/api/admin/members?id=${id}`, { method: "DELETE" });
    await load();
  };

  const startEdit = (m: Member) =>
    setEditing({ ...m, daysList: m.assignedPlayingDays.split(",").filter(Boolean) });

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Manage active and inactive members and their playing days"
        right={<button className="btn-primary" onClick={() => setEditing(empty())}>Add member</button>}
      />

      {loading ? (
        <Empty message="Loading…" />
      ) : items.length === 0 ? (
        <Empty message="No members yet. Add one to get started." />
      ) : (
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Days</th>
                <th className="th">Contact</th>
                <th className="th">Advance</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td className="td font-medium">{m.fullName}</td>
                  <td className="td text-xs text-slate-500">{m.assignedPlayingDays || "—"}</td>
                  <td className="td text-xs">
                    <div>{m.phone}</div>
                    <div className="text-slate-500">{m.email}</div>
                  </td>
                  <td className="td">{money(m.advanceBalance)}</td>
                  <td className="td">
                    <span className={`badge ${m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="td text-right">
                    <button className="btn-secondary mr-2" onClick={() => startEdit(m)}>Edit</button>
                    {m.status === "Active" && (
                      <button className="btn-danger" onClick={() => remove(m.id)}>Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit member" : "Add member"} onClose={() => setEditing(null)}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name">
              <input className="input" value={editing.fullName || ""}
                onChange={e => setEditing({ ...editing, fullName: e.target.value })}/>
            </Field>
            <Field label="Phone">
              <input className="input" value={editing.phone || ""}
                onChange={e => setEditing({ ...editing, phone: e.target.value })}/>
            </Field>
            <Field label="Email">
              <input className="input" value={editing.email || ""}
                onChange={e => setEditing({ ...editing, email: e.target.value })}/>
            </Field>
            <Field label="WhatsApp number">
              <input className="input" value={editing.whatsappNumber || ""}
                onChange={e => setEditing({ ...editing, whatsappNumber: e.target.value })}/>
            </Field>
            <Field label="Advance balance">
              <input className="input" type="number" step="0.01"
                value={editing.advanceBalance ?? 0}
                onChange={e => setEditing({ ...editing, advanceBalance: Number(e.target.value) })}/>
            </Field>
            <Field label="Status">
              <select className="input" value={editing.status}
                onChange={e => setEditing({ ...editing, status: e.target.value as Member["status"] })}>
                <option>Active</option><option>Inactive</option>
              </select>
            </Field>
          </div>

          <div className="mt-3">
            <span className="label">Assigned playing days</span>
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

          <div className="mt-3">
            <Field label="Notes">
              <textarea className="input" rows={3} value={editing.notes || ""}
                onChange={e => setEditing({ ...editing, notes: e.target.value })}/>
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" onClick={save}
              disabled={!editing.fullName?.trim()}>Save</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title, onClose, children
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6"
        onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
