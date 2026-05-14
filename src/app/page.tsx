import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Court Ledger
          </h1>
          <p className="mt-3 text-slate-600 text-lg">
            A clean, simple way to manage your badminton group&apos;s bookings,
            costs and balances.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/admin" className="card hover:shadow-md transition text-left">
            <div className="badge bg-brand-50 text-brand-700 mb-3">Admin</div>
            <h2 className="text-lg font-semibold">Admin dashboard</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sign in with Google to manage members, bookings, expenses and balances.
            </p>
          </Link>
          <Link href="/p" className="card hover:shadow-md transition text-left">
            <div className="badge bg-emerald-50 text-emerald-700 mb-3">Participant</div>
            <h2 className="text-lg font-semibold">Participant view</h2>
            <p className="text-sm text-slate-600 mt-1">
              Public, read-only view of the calendar, expenses and your balance.
            </p>
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Charges are based on reserved playing slots rather than attendance.
        </p>
      </div>
    </main>
  );
}
