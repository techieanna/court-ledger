import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { ParticipationRepo } from "@/lib/sheets/repos";

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  return withAdmin(async () => {
    if (!sessionId) throw new Error("sessionId required");
    return { items: await ParticipationRepo.listBySession(sessionId) };
  });
}

export async function POST(req: NextRequest) {
  // Upsert one or many: { sessionId, entries: [{ memberId, attended }] }
  const body = await req.json();
  return withAdmin(async () => {
    const sessionId = String(body.sessionId || "");
    if (!sessionId) throw new Error("sessionId required");
    const entries: { memberId: string; attended: boolean }[] = body.entries || [];
    for (const e of entries) {
      await ParticipationRepo.upsert(sessionId, e.memberId, !!e.attended);
    }
    return { ok: true, count: entries.length };
  });
}
