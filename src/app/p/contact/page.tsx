"use client";
import { useState } from "react";
import { PageHeader, Field } from "@/components/ui";

export default function ContactAdmin() {
  const [memberName, setMemberName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true); setError(null);
    const res = await fetch("/api/public/support", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName, contact, message })
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    setSubmitted(true);
    setMemberName(""); setContact(""); setMessage("");
  };

  return (
    <>
      <PageHeader title="Contact admin"
        subtitle="Send a message about your account, bookings or payments" />
      {submitted && (
        <div className="card bg-emerald-50 border-emerald-200 text-emerald-800 mb-4">
          Thanks — your message has been sent.
        </div>
      )}
      {error && <div className="card bg-red-50 border-red-200 text-red-700 mb-4">{error}</div>}
      <div className="card max-w-xl space-y-3">
        <Field label="Your name">
          <input className="input" value={memberName} onChange={e => setMemberName(e.target.value)} />
        </Field>
        <Field label="Phone or email (optional)">
          <input className="input" value={contact} onChange={e => setContact(e.target.value)} />
        </Field>
        <Field label="Message">
          <textarea className="input" rows={5} value={message}
            onChange={e => setMessage(e.target.value)} />
        </Field>
        <button className="btn-primary" disabled={busy || !memberName.trim() || !message.trim()} onClick={send}>
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
    </>
  );
}
