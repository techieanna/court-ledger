// Defines all spreadsheet tabs and their header rows.
// The Sheets client auto-creates missing tabs and writes headers on first use.
// NOTE: Google Sheets is only suitable for small group / MVP usage. Replace
// this entire `lib/sheets` directory with a Prisma/Postgres implementation
// to scale; the rest of the app talks only to the per-entity repos.

export interface TabSchema {
  name: string;
  headers: string[];
}

export const TABS = {
  Members: {
    name: "Members",
    headers: [
      "id","fullName","phone","email","whatsappNumber","assignedPlayingDays",
      "status","advanceBalance","notes","createdAt","updatedAt"
    ]
  },
  Bookings: {
    name: "Bookings",
    headers: [
      "id","date","weekday","startTime","endTime","venueName","courtsBooked",
      "status","notes","createdAt","updatedAt"
    ]
  },
  Sessions: {
    name: "Sessions",
    headers: [
      "id","bookingId","date","weekday","status","notes","createdAt","updatedAt"
    ]
  },
  Participation: {
    name: "Participation",
    headers: ["id","sessionId","memberId","attended","createdAt","updatedAt"]
  },
  Expenses: {
    name: "Expenses",
    headers: [
      "id","date","expenseType","amount","description","linkedSessionId",
      "allocationType","allocationWeekdays","createdAt","updatedAt"
    ]
  },
  Payments: {
    name: "Payments",
    headers: [
      "id","memberId","paymentDate","amount","paymentType","notes",
      "createdAt","updatedAt"
    ]
  },
  MonthlySummaries: {
    name: "MonthlySummaries",
    headers: [
      "id","month","memberId","configuredDays","sessionsBooked",
      "sessionsAttended","courtCostShare","sharedCostShare","totalOwed",
      "advanceUsed","amountPaid","outstandingBalance","generatedAt"
    ]
  },
  SupportQueries: {
    name: "SupportQueries",
    headers: [
      "id","memberName","contact","message","status","createdAt","updatedAt"
    ]
  },
  Settings: {
    name: "Settings",
    headers: ["key","value","updatedAt"]
  }
} as const satisfies Record<string, TabSchema>;

export type TabName = keyof typeof TABS;
export const ALL_TABS: TabSchema[] = Object.values(TABS);
