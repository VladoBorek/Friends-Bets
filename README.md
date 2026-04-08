# PB138 Project

Clean client-server split with dedicated packages:
- `client` (React + Vite + generated API hooks)
- `server` (Elysia + Drizzle + PostgreSQL)
- `shared` (shared Zod schemas)
- root package (orchestration scripts only)

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Bun (optional, preferred if installed)
- Docker

### One-command setup

```bash
npm run setup
```

This command:
1. Creates/starts PostgreSQL Docker container `pb138`
2. Installs dependencies in `server` and `client`
3. Runs DB generate/migrate/seed
4. Generates client API from OpenAPI
5. Runs lint

### Start API

```bash
npm run server
```

Server URLs:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/swagger`

### Start frontend

```bash
npm run client
```

Frontend URL:
- App: `http://localhost:5173`

## Scripts (root)

- `npm run setup` - full setup pipeline (uses `bun` where available, falls back to `npm`)
- `npm run server` - start server package
- `npm run client` - start client package
- `npm run build` - build client + server typecheck
- `npm run lint` - lint client + server + root scripts
- `npm run api:generate` - generate `client/src/api/gen`
- `npm run db:generate` - generate drizzle migration
- `npm run db:migrate` - apply migrations
- `npm run db:seed` - seed sample data
- `npm run cli:query` - run query report

## Debugging

### Query summary

```bash
npm run cli:query
```

Shows open wagers, recent bets, and accurate totals.

### Health check

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"status":"ok","service":"pb138-api"}
```

## Notes

- Client and server are separate packages with separate dependency trees.
- Root package is intentionally thin and only orchestrates workflows.
- Shared schemas are in `shared/src/schemas` and imported by both sides.
