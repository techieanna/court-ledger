import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Sessions } from "@/lib/sheets/repos";

export async function GET() {
  return withAdmin(async () => ({ items: await Sessions.list() }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => Sessions.create({
    bookingId: body.bookingId,
    date: body.date,
    weekday: body.weekday,
    status: body.status || "Scheduled",
    notes: body.notes || ""
  }));
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const body = await req.json();
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    return { ok: await Sessions.update(id, body) };
  });
}
