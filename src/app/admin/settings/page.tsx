"use client";
import { useEffect, useState } from "react";
import { PageHeader, Field } from "@/components/ui";
import type { Setting } from "@/types";

export default function SettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const load = async () => {
    const r = await fetch("/api/admin/settings").then(x => x.json());
    setItems(r.items || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!key.trim()) return;
    await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    });
    setKey(""); setValue("");
    await load();
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Free-form key/value settings stored in the Settings tab" />
      <div className="card max-w-xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Key"><input className="input" value={key} onChange={e => setKey(e.target.value)} /></Field>
          <Field label="Value"><input className="input" value={value} onChange={e => setValue(e.target.value)} /></Field>
        </div>
        <button className="btn-primary" onClick={save}>Save</button>
      </div>
      <h2 className="mt-6 font-semibold">Existing settings</h2>
      <ul className="mt-2 divide-y border rounded-xl bg-white">
        {items.length === 0 && <li className="p-3 text-sm text-slate-500">None.</li>}
        {items.map((s, i) => (
          <li key={i} className="p-3 text-sm flex justify-between gap-3">
            <span className="font-mono">{s.key}</span>
            <span className="text-slate-600">{s.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
