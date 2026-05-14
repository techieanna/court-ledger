// Payment recording. Advance and Refund types adjust the member's
// `advanceBalance` atomically with payment creation so future months see
// the correct opening balance.

import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Members, Payments } from "@/lib/sheets/repos";

export async function GET(req: NextRequest) {
  const memberId = new URL(req.url).searchParams.get("memberId");
  return withAdmin(async () => ({
    items: memberId ? await Payments.listByMember(memberId) : await Payments.list()
  }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    const memberId = String(body.memberId || "");
    const amount = Number(body.amount || 0);
    const paymentType = body.paymentType || "Settlement";
    if (!memberId) throw new Error("memberId required");

    const created = await Payments.create({
      memberId,
      paymentDate: body.paymentDate || new Date().toISOString().slice(0, 10),
      amount,
      paymentType,
      notes: body.notes || ""
    });

    // Adjust advance balance for relevant types
    const member = await Members.getById(memberId);
    if (member) {
      let delta = 0;
      if (paymentType === "Advance") delta = amount;
      else if (paymentType === "Refund") delta = -amount;
      else if (paymentType === "Adjustment") delta = Number(body.advanceDelta || 0);
      if (delta !== 0) {
        await Members.update(memberId, {
          advanceBalance: Math.round((member.advanceBalance + delta) * 100) / 100
        });
      }
    }
    return created;
  });
}
