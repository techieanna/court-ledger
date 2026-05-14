"use client";
// Tiny reusable UI primitives. Intentionally minimal — feel free to swap in
// a component library later (shadcn/ui, Radix, etc.).

import { ReactNode } from "react";

export function PageHeader({
  title, subtitle, right
}: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label, value, hint
}: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase text-slate-500 tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export function MonthPicker({
  value, onChange
}: { value: string; onChange: (m: string) => void }) {
  return (
    <input
      type="month"
      className="input max-w-[200px]"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export function Field({
  label, children
}: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="card text-center text-sm text-slate-500">{message}</div>
  );
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" })
    .format(n || 0);
}
