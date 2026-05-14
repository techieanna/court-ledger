"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const sp = useSearchParams();
  const err = sp.get("error");
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="text-sm text-slate-600 mt-1">
          Only the configured admin Google account can manage data.
        </p>
        {err && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">
            Sign-in failed: {err}
          </p>
        )}
        <button
          className="btn-primary mt-6 w-full"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
