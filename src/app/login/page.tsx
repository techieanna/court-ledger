"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const err = sp.get("error");
  const mode = sp.get("mode") || process.env.NEXT_PUBLIC_AUTH_MODE || "auto";
  // We expose NEXT_PUBLIC_AUTH_MODE so the client can show the right form.
  // The server still authoritatively picks the provider from AUTH_MODE.
  const isDev = mode === "dev";
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-slate-600 mt-1">
          Only the configured admin account can manage data.
        </p>
        {err && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">
            Sign-in failed: {err}
          </p>
        )}

        {isDev ? (
          <form
            className="mt-5 space-y-3 text-left"
            onSubmit={e => {
              e.preventDefault();
              signIn("credentials", { email, callbackUrl: "/admin" });
            }}
          >
            <label className="block">
              <span className="label">Email</span>
              <input
                className="input" type="email" required
                placeholder="admin@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </label>
            <button className="btn-primary w-full">Sign in (dev)</button>
            <p className="text-xs text-slate-500">
              Dev mode is on. Enter the email set in <code>ADMIN_EMAIL</code>.
            </p>
          </form>
        ) : (
          <button
            className="btn-primary mt-6 w-full"
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
          >
            Continue with Google
          </button>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
