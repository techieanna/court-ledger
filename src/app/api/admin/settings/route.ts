import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Settings } from "@/lib/sheets/repos";

export async function GET() {
  return withAdmin(async () => ({ items: await Settings.getAll() }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    await Settings.set(String(body.key), String(body.value ?? ""));
    return { ok: true };
  });
}
