# Deployment Guide — SkillTek Institute

SkillTek is a single-institute portal: a Next.js 16 app on **Vercel** with a
**Supabase** PostgreSQL database (via Prisma 7).

## 1. Database — Supabase

Project: `https://sabbtiueycedkrupqzku.supabase.co`

1. In Supabase open **Project Settings → Database** and note (or reset) the
   **database password**.
2. Click **Connect** at the top of the dashboard and copy two strings:
   - **Transaction pooler** (port **6543**) → `DATABASE_URL` (app runtime)
   - **Session pooler** (port **5432**) → `DIRECT_URL` (Prisma migrations)
3. Add the SSL options shown below to the end of each string.

```
DATABASE_URL=postgresql://postgres.sabbtiueycedkrupqzku:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?uselibpqcompat=true&sslmode=require
DIRECT_URL=postgresql://postgres.sabbtiueycedkrupqzku:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

> Don't use the "Direct connection" host (`db.sabbtiueycedkrupqzku.supabase.co`).
> On the free plan it is IPv6-only and Vercel can't reach it.
>
> If your password contains special characters (`@ # / ? %`), URL-encode them
> (e.g. `@` → `%40`).

You don't need Supabase Auth, Storage or the anon/service keys — the app only
uses the Postgres database.

### Current production setup

- Pooler host: `aws-0-ap-northeast-2.pooler.supabase.com`
- The app logs in as a dedicated role `skilltek_app` (owner of the app tables),
  user name `skilltek_app.sabbtiueycedkrupqzku`. Its password lives only in
  Vercel's encrypted env vars. To rotate it, run in the Supabase SQL editor:
  `alter role skilltek_app password 'new-long-random-password';` then update
  `DATABASE_URL` and `DIRECT_URL` in Vercel and redeploy.
- Row Level Security is ON for every table and the public `anon` /
  `authenticated` API roles have no access, so the Supabase anon key can't
  read or change any data. (The "RLS enabled, no policy" notice in Supabase
  is expected.)
- Vercel functions run in `icn1` (Seoul) next to the database.

## 2. Environment variables (Vercel → Settings → Environment Variables)

| Variable         | Required | Notes |
| ---------------- | -------- | ----- |
| `DATABASE_URL`   | yes      | Supabase transaction pooler string (above). |
| `DIRECT_URL`     | yes      | Supabase session pooler string (above). |
| `AUTH_SECRET`    | yes      | Long random string. Without it, login refuses to work in production. |
| `OPENAI_API_KEY` | no       | Enables live AI in the chat widget / AI assist. |
| `OPENAI_MODEL`   | no       | Defaults to `gpt-4o-mini`. |

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Vercel

1. Import the GitHub repo at https://vercel.com/new (Next.js is auto-detected).
2. Add the variables above for **Production** (and Preview if you use it)
   **before** the first deploy.
3. Deploy. The build runs `vercel-build`:
   `prisma generate && prisma migrate deploy && next build`
   so the database tables are created/updated automatically on every deploy.

## 4. Create the admin account (once)

From your computer, with `.env` filled in from `.env.example`:

```bash
npm install
ADMIN_NAME="Sarwar" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-strong-password" npm run db:seed
```

This is **safe**: it only adds the institute settings row and the first admin
if they don't exist yet. It never deletes data and never prints the password.

To completely wipe a database and start over (test databases only):

```bash
SEED_RESET=1 ALLOW_DESTRUCTIVE_SEED=1 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
```

## 5. After the first deploy

- Open `https://<your-app>/login`, sign in as admin.
- **Admin → Settings**: set institute name, contact details and bank details
  (used on fee challans).
- Add courses, then teachers, then students.

## Security notes

- Sessions are signed cookies (HttpOnly, Secure, SameSite=Lax), re-checked
  against the database on every request — deactivating a user logs them out
  immediately.
- Each role only sees its own data: teachers see only their courses' students;
  students see only their own fees, attendance, quizzes and submissions; fee
  exports are admin-only.
- Uploads: max 4 MB total per submission, max 5 files, executable/HTML/SVG
  files rejected; uploaded files are never rendered as web pages.
- Login, enquiry and chat endpoints are rate-limited per IP (in-memory, per
  server instance).
- Never commit `.env`. Rotate `AUTH_SECRET` to force everyone to sign in again.
