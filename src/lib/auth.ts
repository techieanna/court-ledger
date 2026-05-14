// NextAuth configuration. Only the email matching ADMIN_EMAIL is considered
// admin; all other Google accounts can sign in but are blocked at the guard.

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";

// AUTH_MODE=dev → simple Credentials provider (no Google needed).
// Any sign-in attempt matching ADMIN_EMAIL is accepted. For local testing only.
const isDev = (process.env.AUTH_MODE || "").toLowerCase() === "dev";

const providers = isDev
  ? [
      CredentialsProvider({
        name: "Dev login",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "admin@example.com" }
        },
        async authorize(credentials) {
          const email = credentials?.email?.toString().trim().toLowerCase();
          if (!email) return null;
          // Anyone can sign in; the admin guard separately enforces ADMIN_EMAIL,
          // so non-admin sign-ins will land on the "Unauthorised" page.
          return { id: email, email, name: email };
        }
      })
    ]
  : [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
      })
    ];

export const authMode = isDev ? "dev" : "google";

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile, user }) {
      if (profile?.email) token.email = profile.email;
      else if (user?.email) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email as string;
      return session;
    }
  },
  pages: { signIn: "/login" }
};

export function isAdminEmail(email?: string | null): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!email && !!admin && email.trim().toLowerCase() === admin;
}

export async function getSessionSafe() {
  return getServerSession(authOptions);
}

export async function requireAdmin(): Promise<{ email: string }> {
  const session = await getSessionSafe();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return { email: session.user.email };
}
