# ROBO-MODULE — Setup Instructions

## First Time Setup

```bash
# 1. Install dependencies (already done if node_modules exists)
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push database schema (creates the SQLite file)
npx prisma db push

# 4. Seed master data (delay codes, machines, designs, programs, tools, etc.)
npx tsx prisma/seed.ts

# 5. Start development server
npm run dev
```

Open: http://localhost:3000

## Usage Flow

1. Go to **Start Shift** → fill date, shift number, your name → click Start
2. Go to **Batch Setup** → enter batch number, select Design + Program, configure each machine
3. Go to **New Slab Entry** → select batch, enter slab number + times per machine
4. Go to **Delay Logging** → type delay code (e.g. C1) → description auto-fills → enter duration
5. View everything on **Dashboard** or **Active Shift** page
6. Close shift when done

## Docker

```bash
docker-compose up -d
```

## Database

- SQLite file: `prisma/dev.db`
- View/edit: `npx prisma studio`
- Reset: `npx prisma db push --force-reset && npx tsx prisma/seed.ts`
