import Link from "next/link";
import { Suspense } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/p" className="font-semibold text-brand-700">Court Ledger</Link>
          <nav className="flex gap-2 text-sm">
            <Link href="/p" className="nav-link">Calendar</Link>
            <Link href="/p/expenses" className="nav-link">Expenses</Link>
            <Link href="/p/balance" className="nav-link">My balance</Link>
            <Link href="/p/contact" className="nav-link">Contact admin</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <Suspense>{children}</Suspense>
      </main>
      <footer className="text-center text-xs text-slate-400 py-6">
        Read-only participant view · Charges are based on reserved playing slots rather than attendance.
      </footer>
    </div>
  );
}
