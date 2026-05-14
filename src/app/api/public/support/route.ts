// Public support query submission. Only POST is public; admin reads via
// /api/admin/support.

import { NextRequest } from "next/server";
import { safePublic } from "@/lib/api";
import { SupportQueries } from "@/lib/sheets/repos";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return safePublic(async () => {
    const memberName = String(body.memberName || "").trim();
    const message = String(body.message || "").trim();
    if (!memberName || !message) throw new Error("memberName and message are required");
    if (message.length > 5000) throw new Error("message too long");
    return SupportQueries.create({
      memberName,
      contact: String(body.contact || "").slice(0, 200),
      message
    });
  });
}
