// NextAuth configuration. Only the email matching ADMIN_EMAIL is considered
// admin; all other Google accounts can sign in but are blocked at the guard.

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.email) token.email = profile.email;
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
