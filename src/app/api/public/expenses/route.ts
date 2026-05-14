import { NextRequest } from "next/server";
import { safePublic } from "@/lib/api";
import { Expenses } from "@/lib/sheets/repos";

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month")
    || new Date().toISOString().slice(0, 7);
  return safePublic(async () => {
    const items = await Expenses.listByMonth(month);
    const totalsByType: Record<string, number> = {};
    let total = 0;
    for (const e of items) {
      totalsByType[e.expenseType] = (totalsByType[e.expenseType] || 0) + e.amount;
      total += e.amount;
    }
    // Public view hides internal IDs and notes; description is generic.
    const safe = items.map(e => ({
      date: e.date, expenseType: e.expenseType, amount: e.amount,
      description: e.description, allocationType: e.allocationType
    }));
    return { month, items: safe, total, totalsByType };
  });
}
