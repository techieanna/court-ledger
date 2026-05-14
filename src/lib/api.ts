// API helpers shared by route handlers.

import { NextResponse } from "next/server";
import { requireAdmin } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function withAdmin<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    await requireAdmin();
    const data = await fn();
    return NextResponse.json(data);
  } catch (e) {
    const err = e as Error & { status?: number };
    const status = err.status === 401 ? 401 : 500;
    return NextResponse.json(
      { error: err.message || "Server error" }, { status }
    );
  }
}

export async function safePublic<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
