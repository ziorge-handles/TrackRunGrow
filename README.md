# TrackRunGrow

The complete coaching platform for Cross Country & Track and Field.

## Repository layout

The Next.js application lives in this directory (`trackrungrow/`). If you cloned a parent folder that only contains this project, open **`trackrungrow`** as the workspace root in your editor.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Prisma generate + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |
| `npm run db:push` | Push schema to the database (dev) |
| `npm run db:migrate` | Create/apply migrations (dev) |

Copy `.env.example` to `.env.local` and fill in values. For production rate limiting, add **Upstash Redis** (`UPSTASH_REDIS_REST_TOKEN` and `UPSTASH_REDIS_REST_URL`).

## Database

After pulling schema changes, apply migrations (or use `db:push` in development):

```bash
npx prisma migrate deploy
```

If you use `prisma/migrations/20260412004900_add_race_team_relation`, it adds the `Race` → `Team` foreign key and index.
