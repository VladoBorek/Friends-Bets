# PB138 Project (DrizzleORM + Vite + PostgreSQL)

## 🔧 Overview

This repository is a TypeScript full-stack template using:
- Vite + React frontend
- Drizzle ORM and PostgreSQL database
- `tsx` scripts for migrations (`src/db/migrate.ts`), seeding (`src/db/seed.ts`), and a simple query runner (`src/index.ts`)

## 🛠 Prerequisites

- Node.js 18+
- npm
- PostgreSQL (local or remote)

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## 3. Run PostgreSQL locally via Docker

```bash
docker run --detach --name pb138 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=database -p 5432:5432 postgres:latest
```

Stop and remove container:

```bash
docker stop pb138 && docker rm pb138
```

### 2. Generate Drizzle schema

```bash
npm run db:generate
```

### 3. Apply migrations

```bash
npm run db:migrate
```

### 4. Seed initial data

```bash
npm run db:seed
```

## ▶️ Run project

### Dev UI (React frontend)

```bash
npm run dev
```

Then visit `http://localhost:5173` (default Vite URL).

### Database query script (CLI check)

```bash
npm run start
```

This runs `src/index.ts` and prints:
- Open wagers
- Recent bets

## 🧹 Linters

```bash
npm run lint
```

---

Enjoy building! 🚀
