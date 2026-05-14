import { redirect } from "next/navigation";
import { getSessionSafe, isAdminEmail } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionSafe();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  if (!isAdminEmail(email)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-red-700">Unauthorised access</h1>
          <p className="text-sm text-slate-600 mt-2">
            <span className="font-medium">{email}</span> is not the configured admin
            for this app. Please contact the administrator.
          </p>
          <a className="btn-secondary mt-5 inline-flex" href="/api/auth/signout">Sign out</a>
        </div>
      </main>
    );
  }
  return <AdminShell email={email}>{children}</AdminShell>;
}
