// Per-entity repos. Each exposes typed CRUD and entity-specific queries.
// UI code should depend on these, never on SheetRepo or googleapis directly.

import { randomUUID } from "crypto";
import { TABS } from "../schema";
import { Row } from "../repo";
import { getStore } from "../../store/factory";
import {
  Member, Booking, SessionRow, Participation, Expense, Payment,
  MonthlySummary, SupportQuery, Setting, Weekday
} from "@/types";

const toNum = (s: string) => (s === "" ? 0 : Number(s));
const toBool = (s: string) => s === "TRUE" || s === "true";
const now = () => new Date().toISOString();
const newId = () => randomUUID();

// --------- Members ----------
const membersRepo = getStore(TABS.Members);
function toMember(r: Row): Member {
  return {
    id: r.id, fullName: r.fullName, phone: r.phone, email: r.email,
    whatsappNumber: r.whatsappNumber, assignedPlayingDays: r.assignedPlayingDays,
    status: (r.status as Member["status"]) || "Active",
    advanceBalance: toNum(r.advanceBalance),
    notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const Members = {
  async list(includeInactive = false): Promise<Member[]> {
    const rows = await membersRepo.listRaw();
    return rows.map(toMember).filter(m => includeInactive || m.status === "Active");
  },
  async getById(id: string): Promise<Member | null> {
    const rows = await membersRepo.listRaw();
    const r = rows.find(x => x.id === id);
    return r ? toMember(r) : null;
  },
  async create(input: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> {
    const m: Member = { ...input, id: newId(), createdAt: now(), updatedAt: now() };
    await membersRepo.insert(m);
    return m;
  },
  async update(id: string, patch: Partial<Member>): Promise<boolean> {
    return membersRepo.updateById(id, patch);
  },
  async deactivate(id: string): Promise<boolean> {
    return membersRepo.softDelete(id, "Inactive");
  }
};

// --------- Bookings ----------
const bookingsRepo = getStore(TABS.Bookings);
function toBooking(r: Row): Booking {
  return {
    id: r.id, date: r.date, weekday: r.weekday as Weekday,
    startTime: r.startTime, endTime: r.endTime, venueName: r.venueName,
    courtsBooked: toNum(r.courtsBooked),
    status: (r.status as Booking["status"]) || "Confirmed",
    notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const Bookings = {
  async list(): Promise<Booking[]> {
    return (await bookingsRepo.listRaw()).map(toBooking);
  },
  async listByMonth(month: string): Promise<Booking[]> {
    // month = YYYY-MM
    return (await this.list()).filter(b => b.date.startsWith(month));
  },
  async create(input: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> {
    const b: Booking = { ...input, id: newId(), createdAt: now(), updatedAt: now() };
    await bookingsRepo.insert(b);
    return b;
  },
  async update(id: string, patch: Partial<Booking>): Promise<boolean> {
    return bookingsRepo.updateById(id, patch);
  },
  async cancel(id: string): Promise<boolean> {
    return bookingsRepo.updateById(id, { status: "Cancelled" });
  }
};

// --------- Sessions ----------
const sessionsRepo = getStore(TABS.Sessions);
function toSession(r: Row): SessionRow {
  return {
    id: r.id, bookingId: r.bookingId, date: r.date,
    weekday: r.weekday as Weekday,
    status: (r.status as SessionRow["status"]) || "Scheduled",
    notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const Sessions = {
  async list(): Promise<SessionRow[]> {
    return (await sessionsRepo.listRaw()).map(toSession);
  },
  async create(input: Omit<SessionRow, "id" | "createdAt" | "updatedAt">): Promise<SessionRow> {
    const s: SessionRow = { ...input, id: newId(), createdAt: now(), updatedAt: now() };
    await sessionsRepo.insert(s);
    return s;
  },
  async update(id: string, patch: Partial<SessionRow>): Promise<boolean> {
    return sessionsRepo.updateById(id, patch);
  }
};

// --------- Participation ----------
const partRepo = getStore(TABS.Participation);
function toPart(r: Row): Participation {
  return {
    id: r.id, sessionId: r.sessionId, memberId: r.memberId,
    attended: toBool(r.attended),
    createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const ParticipationRepo = {
  async listBySession(sessionId: string): Promise<Participation[]> {
    return (await partRepo.listRaw()).map(toPart).filter(p => p.sessionId === sessionId);
  },
  async upsert(sessionId: string, memberId: string, attended: boolean): Promise<void> {
    const rows = (await partRepo.listRaw()).map(toPart);
    const existing = rows.find(p => p.sessionId === sessionId && p.memberId === memberId);
    if (existing) {
      await partRepo.updateById(existing.id, { attended });
    } else {
      await partRepo.insert({
        id: newId(), sessionId, memberId, attended,
        createdAt: now(), updatedAt: now()
      });
    }
  },
  async listByMonth(month: string, sessionDates: Map<string, string>): Promise<Participation[]> {
    // sessionDates: sessionId -> date
    return (await partRepo.listRaw())
      .map(toPart)
      .filter(p => (sessionDates.get(p.sessionId) || "").startsWith(month));
  }
};

// --------- Expenses ----------
const expensesRepo = getStore(TABS.Expenses);
function toExpense(r: Row): Expense {
  return {
    id: r.id, date: r.date,
    expenseType: r.expenseType as Expense["expenseType"],
    amount: toNum(r.amount), description: r.description,
    linkedSessionId: r.linkedSessionId,
    allocationType: (r.allocationType as Expense["allocationType"]) || "AllMembers",
    allocationWeekdays: r.allocationWeekdays,
    createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const Expenses = {
  async list(): Promise<Expense[]> {
    return (await expensesRepo.listRaw()).map(toExpense);
  },
  async listByMonth(month: string): Promise<Expense[]> {
    return (await this.list()).filter(e => e.date.startsWith(month));
  },
  async create(input: Omit<Expense, "id" | "createdAt" | "updatedAt">): Promise<Expense> {
    const e: Expense = { ...input, id: newId(), createdAt: now(), updatedAt: now() };
    await expensesRepo.insert(e);
    return e;
  },
  async update(id: string, patch: Partial<Expense>): Promise<boolean> {
    return expensesRepo.updateById(id, patch);
  },
  async remove(id: string): Promise<boolean> {
    // No status column; physically clear by setting amount to 0 and description marker.
    // We choose to soft-cancel via description prefix instead of true delete.
    return expensesRepo.updateById(id, { description: "[CANCELLED] ", amount: 0 });
  }
};

// --------- Payments ----------
const paymentsRepo = getStore(TABS.Payments);
function toPayment(r: Row): Payment {
  return {
    id: r.id, memberId: r.memberId, paymentDate: r.paymentDate,
    amount: toNum(r.amount),
    paymentType: (r.paymentType as Payment["paymentType"]) || "Settlement",
    notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const Payments = {
  async list(): Promise<Payment[]> {
    return (await paymentsRepo.listRaw()).map(toPayment);
  },
  async listByMember(memberId: string): Promise<Payment[]> {
    return (await this.list()).filter(p => p.memberId === memberId);
  },
  async listByMonth(month: string): Promise<Payment[]> {
    return (await this.list()).filter(p => p.paymentDate.startsWith(month));
  },
  async create(input: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment> {
    const p: Payment = { ...input, id: newId(), createdAt: now(), updatedAt: now() };
    await paymentsRepo.insert(p);
    return p;
  }
};

// --------- MonthlySummaries ----------
const summariesRepo = getStore(TABS.MonthlySummaries);
function toSummary(r: Row): MonthlySummary {
  return {
    id: r.id, month: r.month, memberId: r.memberId,
    configuredDays: r.configuredDays,
    sessionsBooked: toNum(r.sessionsBooked),
    sessionsAttended: toNum(r.sessionsAttended),
    courtCostShare: toNum(r.courtCostShare),
    sharedCostShare: toNum(r.sharedCostShare),
    totalOwed: toNum(r.totalOwed),
    advanceUsed: toNum(r.advanceUsed),
    amountPaid: toNum(r.amountPaid),
    outstandingBalance: toNum(r.outstandingBalance),
    generatedAt: r.generatedAt
  };
}
export const MonthlySummaries = {
  async listByMonth(month: string): Promise<MonthlySummary[]> {
    return (await summariesRepo.listRaw()).map(toSummary).filter(s => s.month === month);
  },
  async upsert(rows: Omit<MonthlySummary, "id" | "generatedAt">[]): Promise<void> {
    const existing = (await summariesRepo.listRaw()).map(toSummary);
    for (const r of rows) {
      const found = existing.find(e => e.month === r.month && e.memberId === r.memberId);
      const payload = { ...r, generatedAt: now() };
      if (found) await summariesRepo.updateById(found.id, payload);
      else await summariesRepo.insert({ ...payload, id: newId() });
    }
  }
};

// --------- SupportQueries ----------
const supportRepo = getStore(TABS.SupportQueries);
function toSupport(r: Row): SupportQuery {
  return {
    id: r.id, memberName: r.memberName, contact: r.contact, message: r.message,
    status: (r.status as SupportQuery["status"]) || "Open",
    createdAt: r.createdAt, updatedAt: r.updatedAt
  };
}
export const SupportQueries = {
  async list(): Promise<SupportQuery[]> {
    return (await supportRepo.listRaw()).map(toSupport);
  },
  async create(input: Omit<SupportQuery, "id" | "createdAt" | "updatedAt" | "status"> & { status?: SupportQuery["status"] }): Promise<SupportQuery> {
    const s: SupportQuery = {
      ...input,
      status: input.status ?? "Open",
      id: newId(), createdAt: now(), updatedAt: now()
    };
    await supportRepo.insert(s);
    return s;
  },
  async update(id: string, patch: Partial<SupportQuery>): Promise<boolean> {
    return supportRepo.updateById(id, patch);
  }
};

// --------- Settings ----------
// The Settings tab uses `key` as the primary key. We always append on set();
// getAll() returns the most recent entry per key, so duplicates are harmless.
// This keeps the implementation backend-agnostic.
const settingsRepo = getStore(TABS.Settings);
export const Settings = {
  async getAll(): Promise<Setting[]> {
    const rows = await settingsRepo.listRaw();
    const latest = new Map<string, Setting>();
    for (const r of rows) {
      const prev = latest.get(r.key);
      if (!prev || (r.updatedAt || "") >= (prev.updatedAt || "")) {
        latest.set(r.key, { key: r.key, value: r.value, updatedAt: r.updatedAt });
      }
    }
    return Array.from(latest.values()).sort((a, b) => a.key.localeCompare(b.key));
  },
  async set(key: string, value: string): Promise<void> {
    await settingsRepo.insert({ key, value, updatedAt: now() });
  }
};
