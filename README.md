# SkillTek Institute

Institute management portal: public marketing site + role-based dashboards
(Admin, Teacher, Student) for courses, students, teachers, attendance, fees
(challans), assignments, quizzes, notices and enquiries.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19**
- **Prisma 7** with `@prisma/adapter-pg` on **PostgreSQL**
- **Tailwind CSS 4**, `lucide-react`, `recharts`
- Auth: signed session JWT (`jose`) + `bcryptjs` password hashing

## Getting started

1. Install dependencies (also runs `prisma generate`):

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set `DATABASE_URL` + `AUTH_SECRET`.

3. Apply migrations and seed (seed is destructive — see below):

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Run the dev server: `npm run dev` → http://localhost:3000

Default admin created by the seed: `sarwaralii785@gmail.com` / `sarwar123`
(change after first login).

## Scripts

| Command             | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server.                                          |
| `npm run build`     | Production build (runs `prisma generate`).           |
| `npm run db:migrate`| Create/apply a dev migration.                        |
| `npm run db:deploy` | Apply committed migrations (used in production).     |
| `npm run db:seed`   | Reset data + create admin (**wipes all data**).      |
| `npm run db:studio` | Prisma Studio.                                       |

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the Vercel + Neon walkthrough.
