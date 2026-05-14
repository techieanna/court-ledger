# Court Ledger

A clean, mobile-friendly web app for managing a badminton group's bookings,
running costs, member participation, advance payments and outstanding
balances — built on Next.js with Google Sheets as the data layer.

> The financial model is based on **reserved playing slots**, not attendance.
> A member who signs up for Mondays pays for every Monday booking whether
> they show up or not. Attendance tracking is purely informational.

---

## Stack

- **Next.js 14 (App Router)** + TypeScript + Tailwind CSS
- **NextAuth.js** with Google OAuth (admin-only)
- **Google Sheets API** (`googleapis`) via a service account
- All data access lives in `src/lib/sheets/*` so the data layer can later be
  swapped to PostgreSQL/Prisma without touching the UI.

## Folder layout

```
src/
  app/
    (root)/                  Landing, login
    admin/                   Protected admin pages (requires admin email)
    p/                       Public participant pages (read-only)
    api/
      auth/[...nextauth]/    Google OAuth handler
      admin/...              Admin write APIs (auth-guarded server side)
      public/...             Public read APIs + support submission
  components/                Reusable UI (sidebar, primitives)
  lib/
    auth.ts                  NextAuth config + admin guard
    api.ts                   Route handler helpers
    sheets/
      schema.ts              Tab + header definitions
      client.ts              Google Sheets client + bootstrap
      repo.ts                Generic row-level CRUD
      repos/index.ts         Per-entity typed repos
    calc/balances.ts         Cost-distribution engine
  types/                     Shared domain types
scripts/seed.ts              Sample data seeder
```

## Quickstart (local, zero external services)

Run the app entirely on your laptop, no Google Cloud or Sheets required:

```bash
npm install
cp .env.example .env.local       # already configured for local dev
npm run dev
```

Open http://localhost:3100:
- **Admin** → http://localhost:3100/admin — sign in with `admin@example.com`
  (any email works at the form; only the one matching `ADMIN_EMAIL` is granted
  admin rights, the rest see "Unauthorised access")
- **Participant** → http://localhost:3100/p

Data is written to JSON files under `./data/` (gitignored). Delete that
folder to reset.

Optional seed:

```bash
npx tsx scripts/seed.ts
```

When you want to switch to Google Sheets / Google OAuth (e.g. for Vercel):

```env
DATA_BACKEND=sheets
AUTH_MODE=
NEXT_PUBLIC_AUTH_MODE=
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="..."
```

The repo factory (`src/lib/store/factory.ts`) swaps in `SheetRepo` and the
auth module swaps in `GoogleProvider` — no code changes required.

## Production setup (Google Sheets)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Google Cloud project

1. Go to https://console.cloud.google.com and create a project.
2. Enable the **Google Sheets API**.
3. Create OAuth credentials (type: Web application):
   - Authorized redirect URI: `http://localhost:3100/api/auth/callback/google`
   - Note the **Client ID** and **Client secret**.
4. Create a **Service Account**, then create a JSON key. Save the
   `client_email` and `private_key` values.

### 3. Create the spreadsheet

1. Create an empty Google Sheet — note its **spreadsheet ID** (the long
   string in the URL).
2. Share the sheet with the service-account email (Editor permission).
3. The app auto-creates all required tabs and writes header rows on first
   API call — no manual tab setup needed.

### 4. Configure `.env`

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required keys:
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAIL` — Google account allowed to administer
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`

### 5. Run

```bash
npm run dev
```

Visit:
- `http://localhost:3100` — landing
- `http://localhost:3100/admin` — admin (Google login required)
- `http://localhost:3100/p` — public participant view

### 6. (Optional) Seed sample data

```bash
npx tsx scripts/seed.ts
```

---

## Authentication model

- Anyone with a Google account can attempt to sign in.
- The middleware/guard checks `session.user.email === process.env.ADMIN_EMAIL`.
- Non-admin accounts see an "Unauthorised access" message.
- All `/api/admin/*` routes call `requireAdmin()` server-side; never trust
  the UI alone.
- Public routes (`/api/public/*`) are read-only, plus a single POST
  endpoint to submit support queries.
- Participant pages are unauthenticated and accessed via shareable URL.

## API surface

### Admin (auth required)

| Method | Path | Purpose |
| --- | --- | --- |
| GET / POST / PATCH / DELETE | `/api/admin/members` | CRUD; soft-delete via status |
| GET / POST / PATCH / DELETE | `/api/admin/bookings` | CRUD; DELETE marks Cancelled |
| GET / POST / PATCH | `/api/admin/sessions` | Sessions are created on demand |
| GET / POST | `/api/admin/participation?sessionId=…` | Upsert attendance |
| GET / POST / PATCH / DELETE | `/api/admin/expenses` | CRUD |
| GET / POST | `/api/admin/payments` | Record settlements / advance / refund |
| GET / POST | `/api/admin/summaries?month=YYYY-MM` | Compute / persist monthly balances |
| GET / PATCH | `/api/admin/support` | Triage support queries |
| GET / POST | `/api/admin/settings` | Key/value settings |

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/public/calendar?month=YYYY-MM` | Bookings for the month |
| GET | `/api/public/expenses?month=YYYY-MM` | Sanitised expenses summary |
| GET | `/api/public/balance?memberId=…&month=…` | Live balance for one member |
| POST | `/api/public/support` | Submit a support query |

## Calculation engine

`src/lib/calc/balances.ts` is the single source of truth for charging:

1. For each active member, count bookings in the month whose `weekday`
   matches their `assignedPlayingDays`.
2. **Court Booking** expenses (and any expense with a `linkedSessionId`)
   split equally among members whose playing days include the expense
   date's weekday. Cancelled bookings do not contribute.
3. **Shared expenses** split per `allocationType`:
   - `AllMembers`: across every active member
   - `WeekdayGroup`: across members assigned to any listed weekday
4. `outstanding = totalOwed - amountPaid - advanceUsed` (clamped at 0 for
   advance usage). Negative results indicate credit.
5. Attendance counts are calculated but never affect any monetary value.

## Replacing Google Sheets later

The UI, routes, and calc layer depend only on the per-entity repos in
`src/lib/sheets/repos/index.ts`. To migrate to PostgreSQL:

1. Re-implement each exported object (`Members`, `Bookings`, …) with a
   Prisma-backed version of the same method signatures.
2. Delete `src/lib/sheets/{client,repo,schema}.ts`.
3. No changes required to API routes, calc, or pages.

Google Sheets is suitable for small group / MVP workloads only. The
service-account approach has rate limits (≈100 requests/100 seconds/user);
do not deploy to a large group as-is.

## Phase 2/3 ideas

- Email & WhatsApp send integration
- CSV export and printable summaries
- Receipt photo uploads
- Multi-group support
- Postgres migration
