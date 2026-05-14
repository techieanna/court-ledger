// Sample data seeder. Run with:  npx tsx scripts/seed.ts
// Requires .env to be configured.

import "dotenv/config";
import { Bookings, Expenses, Members, Payments } from "../src/lib/sheets/repos";

async function main() {
  console.log("Seeding sample data…");

  const alice = await Members.create({
    fullName: "Alice Example", phone: "+447000000001", email: "alice@example.com",
    whatsappNumber: "+447000000001",
    assignedPlayingDays: "Monday,Thursday",
    status: "Active", advanceBalance: 50, notes: "Captain"
  });
  const bob = await Members.create({
    fullName: "Bob Example", phone: "+447000000002", email: "bob@example.com",
    whatsappNumber: "+447000000002",
    assignedPlayingDays: "Monday",
    status: "Active", advanceBalance: 0, notes: ""
  });
  const cara = await Members.create({
    fullName: "Cara Example", phone: "+447000000003", email: "cara@example.com",
    whatsappNumber: "+447000000003",
    assignedPlayingDays: "Thursday",
    status: "Active", advanceBalance: 100, notes: ""
  });

  const month = new Date().toISOString().slice(0, 7);
  const monday = `${month}-07`;     // adjust if not a Monday — illustrative only
  const thursday = `${month}-10`;

  await Bookings.create({
    date: monday, weekday: "Monday", startTime: "19:00", endTime: "21:00",
    venueName: "Local Leisure Centre", courtsBooked: 2, status: "Confirmed", notes: ""
  });
  await Bookings.create({
    date: thursday, weekday: "Thursday", startTime: "19:00", endTime: "21:00",
    venueName: "Local Leisure Centre", courtsBooked: 1, status: "Confirmed", notes: ""
  });

  await Expenses.create({
    date: monday, expenseType: "Court Booking", amount: 40,
    description: "Monday court hire", linkedSessionId: "",
    allocationType: "AllMembers"
  });
  await Expenses.create({
    date: thursday, expenseType: "Court Booking", amount: 20,
    description: "Thursday court hire", linkedSessionId: "",
    allocationType: "AllMembers"
  });
  await Expenses.create({
    date: `${month}-05`, expenseType: "Shuttle Purchase", amount: 24,
    description: "Tube of shuttles", linkedSessionId: "",
    allocationType: "AllMembers"
  });

  await Payments.create({
    memberId: alice.id, paymentDate: `${month}-01`, amount: 50,
    paymentType: "Advance", notes: "Top-up"
  });
  await Payments.create({
    memberId: bob.id, paymentDate: `${month}-01`, amount: 25,
    paymentType: "Settlement", notes: "Cleared last month"
  });

  console.log("Done. Members:", [alice.id, bob.id, cara.id]);
}

main().catch(e => { console.error(e); process.exit(1); });
