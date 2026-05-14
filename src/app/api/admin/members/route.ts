import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Members } from "@/lib/sheets/repos";

export async function GET() {
  return withAdmin(async () => ({ items: await Members.list(true) }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    const m = await Members.create({
      fullName: String(body.fullName || "").trim(),
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      whatsappNumber: String(body.whatsappNumber || ""),
      assignedPlayingDays: Array.isArray(body.assignedPlayingDays)
        ? body.assignedPlayingDays.join(",")
        : String(body.assignedPlayingDays || ""),
      status: body.status === "Inactive" ? "Inactive" : "Active",
      advanceBalance: Number(body.advanceBalance || 0),
      notes: String(body.notes || "")
    });
    return m;
  });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const body = await req.json();
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    if (Array.isArray(body.assignedPlayingDays)) {
      body.assignedPlayingDays = body.assignedPlayingDays.join(",");
    }
    const ok = await Members.update(id, body);
    return { ok };
  });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    const ok = await Members.deactivate(id);
    return { ok };
  });
}
