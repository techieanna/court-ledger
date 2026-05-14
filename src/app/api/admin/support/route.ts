import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { SupportQueries } from "@/lib/sheets/repos";

export async function GET() {
  return withAdmin(async () => ({ items: await SupportQueries.list() }));
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const body = await req.json();
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    return { ok: await SupportQueries.update(id, body) };
  });
}
