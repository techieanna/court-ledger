// Domain types shared across the app.
// All entities are stored in Google Sheets as flat rows; arrays are stored
// as comma-separated strings (e.g. assignedPlayingDays = "Monday,Thursday").

export type Weekday =
  | "Monday" | "Tuesday" | "Wednesday" | "Thursday"
  | "Friday" | "Saturday" | "Sunday";

export const WEEKDAYS: Weekday[] = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

export type MemberStatus = "Active" | "Inactive";
export type BookingStatus = "Confirmed" | "Pending" | "Cancelled";
export type SessionStatus = "Scheduled" | "Played" | "Cancelled";

export type ExpenseType =
  | "Court Booking" | "Shuttle Purchase" | "Coaching"
  | "Tournament Fee" | "Snacks/Refreshments" | "Other";

export type AllocationType = "AllMembers" | "WeekdayGroup";
export type PaymentType = "Advance" | "Settlement" | "Refund" | "Adjustment";

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  assignedPlayingDays: string;  // CSV of Weekday
  status: MemberStatus;
  advanceBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  date: string;        // YYYY-MM-DD
  weekday: Weekday;
  startTime: string;   // HH:mm
  endTime: string;
  venueName: string;
  courtsBooked: number;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRow {
  id: string;
  bookingId: string;
  date: string;
  weekday: Weekday;
  status: SessionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participation {
  id: string;
  sessionId: string;
  memberId: string;
  attended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  expenseType: ExpenseType;
  amount: number;
  description: string;
  linkedSessionId: string;     // optional FK
  allocationType: AllocationType;
  // For WeekdayGroup we store CSV of Weekday in description-adjacent column:
  allocationWeekdays?: string; // optional CSV; kept in `notes`-style field
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  memberId: string;
  paymentDate: string;
  amount: number;
  paymentType: PaymentType;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  id: string;
  month: string;       // YYYY-MM
  memberId: string;
  configuredDays: string;
  sessionsBooked: number;
  sessionsAttended: number;
  courtCostShare: number;
  sharedCostShare: number;
  totalOwed: number;
  advanceUsed: number;
  amountPaid: number;
  outstandingBalance: number;
  generatedAt: string;
}

export interface SupportQuery {
  id: string;
  memberName: string;
  contact: string;
  message: string;
  status: "Open" | "Resolved";
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}
