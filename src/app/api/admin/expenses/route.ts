import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Expenses } from "@/lib/sheets/repos";

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month");
  return withAdmin(async () => ({
    items: month ? await Expenses.listByMonth(month) : await Expenses.list()
  }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => Expenses.create({
    date: body.date,
    expenseType: body.expenseType,
    amount: Number(body.amount || 0),
    description: body.description || "",
    linkedSessionId: body.linkedSessionId || "",
    allocationType: body.allocationType || "AllMembers",
    allocationWeekdays: Array.isArray(body.allocationWeekdays)
      ? body.allocationWeekdays.join(",")
      : (body.allocationWeekdays || "")
  }));
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const body = await req.json();
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    if (Array.isArray(body.allocationWeekdays)) {
      body.allocationWeekdays = body.allocationWeekdays.join(",");
    }
    return { ok: await Expenses.update(id, body) };
  });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    return { ok: await Expenses.remove(id) };
  });
}
