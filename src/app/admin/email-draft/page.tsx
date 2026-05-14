"use client";
import { useMemo, useState } from "react";
import { PageHeader, Field } from "@/components/ui";
import { WEEKDAYS } from "@/types";

export default function EmailDraftPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [contactName, setContactName] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState("19:00-21:00");
  const [courts, setCourts] = useState(2);
  const [groupName, setGroupName] = useState("Our Badminton Group");

  const subject = useMemo(() =>
    `Bulk court booking request – ${groupName} – ${startDate || ""} to ${endDate || ""}`,
    [groupName, startDate, endDate]);

  const body = useMemo(() => {
    return `Dear ${contactName || "Bookings team"},

I hope this email finds you well. I am writing on behalf of ${groupName} to request a bulk court booking at ${venue || "your venue"} for the period below.

Booking details:
• Date range: ${startDate || "<start>"} to ${endDate || "<end>"}
• Preferred weekdays: ${days.length ? days.join(", ") : "<weekdays>"}
• Preferred time slots: ${timeSlots}
• Number of courts required: ${courts}

Could you please confirm availability, pricing, and any required deposit or paperwork? We would also appreciate confirmation of cancellation policies for any individual sessions.

Thank you for your time and help.

Kind regards,
${groupName}`;
  }, [contactName, groupName, venue, startDate, endDate, days, timeSlots, courts]);

  const copy = async () => { await navigator.clipboard.writeText(body); alert("Copied to clipboard"); };
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <>
      <PageHeader title="Bulk booking email draft"
        subtitle="Generate a professional request to the leisure centre. Nothing is sent automatically." />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <Field label="Group name">
            <input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} />
          </Field>
          <Field label="Recipient email">
            <input className="input" value={to} onChange={e => setTo(e.target.value)} />
          </Field>
          <Field label="Recipient contact name">
            <input className="input" value={contactName} onChange={e => setContactName(e.target.value)} />
          </Field>
          <Field label="Venue / leisure centre">
            <input className="input" value={venue} onChange={e => setVenue(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From date">
              <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </Field>
            <Field label="To date">
              <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </Field>
          </div>
          <div>
            <span className="label">Weekdays</span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(d => {
                const active = days.includes(d);
                return (
                  <button key={d} type="button"
                    onClick={() => setDays(active ? days.filter(x => x !== d) : [...days, d])}
                    className={`badge cursor-pointer ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Time slots">
            <input className="input" value={timeSlots} onChange={e => setTimeSlots(e.target.value)} />
          </Field>
          <Field label="Courts required">
            <input className="input" type="number" min={1} value={courts}
              onChange={e => setCourts(Number(e.target.value))} />
          </Field>
          <Field label="Your email (optional, for signature)">
            <input className="input" value={from} onChange={e => setFrom(e.target.value)} />
          </Field>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={copy}>Copy</button>
              <a className="btn-primary" href={mailto}>Open in mail app</a>
            </div>
          </div>
          <div className="text-xs uppercase text-slate-500">Subject</div>
          <div className="mb-3 text-sm">{subject}</div>
          <div className="text-xs uppercase text-slate-500">Body</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">{body}</pre>
        </div>
      </div>
    </>
  );
}
