"use client";
import { useMemo, useState } from "react";
import { PageHeader, Field } from "@/components/ui";

const TEMPLATES = {
  "Last-minute cancellation": "Hi all, unfortunately tonight's session at {venue} on {date} {time} has been cancelled. Reason: {reason}. Apologies for the short notice.",
  "Time change": "Hi all, please note the time for {date} at {venue} has changed to {time}. See you there!",
  "Court change": "Hi all, our court for {date} {time} at {venue} has been moved to court {court}. Thanks!",
  "Venue change": "Hi all, our session on {date} at {time} has been moved from {oldVenue} to {venue}. See you there!",
  "Payment reminder": "Hi {name}, friendly reminder that you have an outstanding balance of £{amount} for this month. Please settle when you can — thanks!",
  "General announcement": "Hi all, {message}"
};

type Key = keyof typeof TEMPLATES;
const KEYS = Object.keys(TEMPLATES) as Key[];

export default function WhatsappPage() {
  const [type, setType] = useState<Key>("Last-minute cancellation");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");

  const text = useMemo(() => {
    let out: string = TEMPLATES[type];
    for (const [k, v] of Object.entries(fields)) {
      out = out.replaceAll(`{${k}}`, v || `{${k}}`);
    }
    return out;
  }, [type, fields]);

  const placeholders = (TEMPLATES[type].match(/\{(\w+)\}/g) || []).map(m => m.slice(1, -1));
  const copy = async () => { await navigator.clipboard.writeText(text); alert("Copied"); };
  const waLink = `https://wa.me/${encodeURIComponent(phone.replace(/[^0-9]/g, ""))}?text=${encodeURIComponent(text)}`;

  return (
    <>
      <PageHeader title="WhatsApp message helper"
        subtitle="Prepare clear messages to share with the group. No integration — copy or open in WhatsApp." />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <Field label="Message type">
            <select className="input" value={type} onChange={e => { setType(e.target.value as Key); setFields({}); }}>
              {KEYS.map(k => <option key={k}>{k}</option>)}
            </select>
          </Field>
          {placeholders.map(p => (
            <Field key={p} label={p}>
              <input className="input" value={fields[p] || ""}
                onChange={e => setFields({ ...fields, [p]: e.target.value })}/>
            </Field>
          ))}
          <Field label="Recipient phone (optional, international format)">
            <input className="input" placeholder="+447xxxxxxxxx"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={copy}>Copy</button>
              <a className="btn-primary" href={waLink} target="_blank" rel="noreferrer">
                Open WhatsApp
              </a>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">{text}</pre>
        </div>
      </div>
    </>
  );
}
