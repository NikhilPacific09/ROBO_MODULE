# ROBO-MODULE — Session State (saved 2026-07-15)

## WHERE WE ARE
Project is **fully built** — all files exist at `C:\Users\User\Desktop\ROBO-MODULE`.
Waiting on a fresh `npm install` to complete startup.

---

## THE ONE REMAINING PROBLEM (Prisma 7 fix — JUST APPLIED)
`npx prisma` was pulling Prisma **v7** which broke the old `url = env(...)` syntax.
Fixed in this session by:
1. `prisma/schema.prisma` — removed `url` from datasource, added `driverAdapters` preview feature
2. `prisma.config.ts` *(new file at root)* — Prisma 7 config using `@libsql/client`
3. `src/lib/prisma.ts` — updated to use `PrismaLibSQL` adapter
4. `prisma/seed.ts` — same adapter fix
5. `package.json` — updated to `prisma@^7`, added `@libsql/client` + `@prisma/adapter-libsql`

---

## STARTUP COMMANDS (run these in order after restart)

```powershell
cd C:\Users\User\Desktop\ROBO-MODULE

# 1. Install all packages (fixes tsx missing error too)
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create the SQLite database + tables
npx prisma db push

# 4. Seed master data (57 delay codes, 4 machines, operators, designs, programs, tools, liquids, powders)
npm run db:seed

# 5. Start the app
npm run dev
```

Then open: **http://localhost:3000**

---

## COMPLETE PROJECT STRUCTURE

### Tech Stack
- Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Prisma 7 + SQLite (via @libsql/client adapter)
- Recharts for charts

### Database Models (prisma/schema.prisma)
Machine, Operator, Design, Program, Tool, Liquid, Powder, DelayCode, Shift, ShiftOperatorAssignment, BatchRecipe, BatchRecipeEntry, ProductionRecord, MachineEntry, DelayLog

### API Routes (27 total)
- `/api/machines` CRUD
- `/api/operators` CRUD
- `/api/designs` CRUD
- `/api/programs` CRUD
- `/api/tools` CRUD
- `/api/liquids` CRUD
- `/api/powders` CRUD
- `/api/delay-codes` (GET all, grouped by category)
- `/api/delay-codes/lookup?code=C1` (single lookup)
- `/api/shifts` (GET all + POST, 409 if active exists)
- `/api/shifts/active` (GET)
- `/api/shifts/[id]` (GET full + PATCH close)
- `/api/shifts/[id]/operators` (GET + POST + DELETE)
- `/api/batch-recipes` (GET + POST with nested entries)
- `/api/batch-recipes/[id]` (GET)
- `/api/production` (GET + POST with MachineEntries)
- `/api/production/[id]` (GET + PATCH)
- `/api/delays` (GET + POST)
- `/api/delays/[id]` (DELETE)

### Pages (18 total)
- `/` — Dashboard (active shift banner, stats, delay chart)
- `/shift/start` — Start new shift form
- `/shift/active` — Active shift view (operators, batches, slabs, delays, close)
- `/batch/new` — New batch recipe form
- `/production/new` — New slab entry form
- `/production` — All production records table
- `/production/[id]` — Individual slab detail
- `/delays` — Log delay + view delay log
- `/reports` — Charts: slabs/shift, delay categories, shift summary table
- `/masters` — Hub page
- `/masters/machines` — Machine CRUD
- `/masters/operators` — Operator CRUD
- `/masters/designs` — Design CRUD
- `/masters/programs` — Program CRUD
- `/masters/tools` — Tool CRUD
- `/masters/liquids` — Liquid CRUD
- `/masters/powders` — Powder CRUD
- `/masters/delay-codes` — Read-only, all 57 codes grouped by category

### Seed Data
- **4 Machines**: Roycut-1, Roycut-2, Roycut-3, Roymix
- **57 Delay Codes**: RM1-RM12, L1-L6, D1-D4, S1, P1-P2, M1-M15, C1-C15, G1-G3, T1-T4
  - Robot-specific (require machine selection): M, C, G categories
  - Line-wide (no machine): RM, L, D, S, P, T categories
- Reference designs, programs, tools, liquids, powders from factory data

### Workflow
1. Start Shift → assigns operators
2. Create Batch Recipe → configure design/program/tool/liquid/powder per machine once
3. Log Production (Slab Entry) → one record per slab, per-machine in/out times
4. Log Delays → code-based lookup, robot codes need machine selection
5. Close Shift

---

## KEY FILES CHANGED IN THIS SESSION
- `package.json` — Prisma 7, @libsql/client, @prisma/adapter-libsql added
- `prisma.config.ts` — NEW FILE (Prisma 7 requirement)
- `prisma/schema.prisma` — removed url from datasource, added driverAdapters
- `src/lib/prisma.ts` — libsql adapter
- `prisma/seed.ts` — libsql adapter

---

## AFTER IT RUNS
When app is running, next things to potentially add:
- Shift performance reports (cycle time trending)
- Export to Excel/PDF
- User authentication
- Batch comparison across shifts
