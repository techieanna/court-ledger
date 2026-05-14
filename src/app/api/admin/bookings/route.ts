import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { Bookings } from "@/lib/sheets/repos";
import { Weekday } from "@/types";

const WEEKDAYS: Weekday[] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const weekdayOf = (iso: string): Weekday => WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];

export async function GET(req: NextRequest) {
  const month = new URL(req.url).searchParams.get("month");
  return withAdmin(async () => ({
    items: month ? await Bookings.listByMonth(month) : await Bookings.list()
  }));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return withAdmin(async () => {
    if (!body.date) throw new Error("date required");
    return Bookings.create({
      date: body.date,
      weekday: (body.weekday as Weekday) || weekdayOf(body.date),
      startTime: body.startTime || "",
      endTime: body.endTime || "",
      venueName: body.venueName || "",
      courtsBooked: Number(body.courtsBooked || 1),
      status: body.status || "Confirmed",
      notes: body.notes || ""
    });
  });
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const body = await req.json();
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    return { ok: await Bookings.update(id, body) };
  });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  return withAdmin(async () => {
    if (!id) throw new Error("id required");
    return { ok: await Bookings.cancel(id) };
  });
}
