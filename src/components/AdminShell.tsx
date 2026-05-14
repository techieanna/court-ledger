"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/participation", label: "Participation" },
  { href: "/admin/bookings", label: "Bookings Calendar" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/payments", label: "Payments & Balances" },
  { href: "/admin/email-draft", label: "Email Draft" },
  { href: "/admin/whatsapp", label: "WhatsApp Messages" },
  { href: "/admin/support", label: "Support Queries" },
  { href: "/admin/settings", label: "Settings" }
];

export default function AdminShell({
  children, email
}: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className={`${open ? "block" : "hidden"} md:block md:w-64 bg-white border-r border-slate-200 md:h-screen md:sticky md:top-0`}>
        <div className="p-5 border-b border-slate-100">
          <Link href="/admin" className="font-bold text-lg text-brand-700">Court Ledger</Link>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{email}</p>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(n => {
            const active = pathname === n.href || pathname?.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="nav-link w-full text-left text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between md:hidden">
          <button className="btn-secondary" onClick={() => setOpen(!open)}>Menu</button>
          <span className="font-semibold">Court Ledger</span>
          <span className="w-10" />
        </header>
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
