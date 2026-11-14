# SkillTek Institute

Management portal for a single institute: public website + role-based
dashboards (Admin, Teacher, Student) for courses, students, teachers,
attendance, fee challans, assignments, quizzes, notices and enquiries.

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Prisma 7** (`@prisma/adapter-pg`) on **PostgreSQL** (Supabase)
- **Tailwind CSS 4**, `lucide-react`, `recharts`, `pdf-lib`
- Auth: signed session JWT (`jose`) + `bcryptjs` password hashing

## Getting started (local)

1. `npm install` (also runs `prisma generate`)
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`.
3. Create the tables and the first admin:

   ```bash
   npm run db:deploy
   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run db:seed
   ```

4. `npm run dev` → http://localhost:3000

## Scripts

| Command              | Purpose |
| -------------------- | ------- |
| `npm run dev`        | Dev server. |
| `npm run build`      | Production build. |
| `npm run typecheck`  | TypeScript check. |
| `npm run db:migrate` | Create/apply a dev migration. |
| `npm run db:deploy`  | Apply committed migrations (production). |
| `npm run db:seed`    | Create settings + first admin (non-destructive). |
| `npm run db:studio`  | Prisma Studio. |

## Deployment

See [DEPLOY.md](./DEPLOY.md) — Vercel + Supabase walkthrough.
