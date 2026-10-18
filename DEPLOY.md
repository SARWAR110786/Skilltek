# Deployment Guide

SkillTek Institute is a Next.js 16 app backed by PostgreSQL (Prisma 7). The
recommended free stack is **Vercel** (hosting) + **Neon** (Postgres).

## 1. Database — Neon

1. Create a project at https://neon.tech (free tier).
2. Open **Connection Details** and copy the **pooled** connection string
   (the host contains `-pooler`). It looks like:
   `postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require`
3. Keep this as `DATABASE_URL`.

## 2. Environment variables

| Variable         | Required | Notes                                                       |
| ---------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`   | yes      | Neon **pooled** connection string (must include `sslmode`). |
| `AUTH_SECRET`    | yes      | Signs the session JWT. In production the app refuses to start auth without it. |
| `OPENAI_API_KEY` | no       | Enables live AI replies in the chat widget.                 |
| `OPENAI_MODEL`   | no       | Defaults to a built-in model when the key is set.           |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Vercel

1. Import the Git repository at https://vercel.com/new (framework is auto-detected
   as Next.js).
2. Add the environment variables above (Production + Preview) **before** deploying.
3. Deploy. The build automatically runs (see `package.json`):
   - `postinstall` → `prisma generate`
   - `vercel-build` → `prisma generate && prisma migrate deploy && next build`

   `prisma migrate deploy` applies the committed migrations to Neon on every deploy.

## 4. First-time database setup

After the first deploy, create the admin account and institute settings. This
step is **destructive** (it wipes all data), so it is never run automatically:

```bash
# Local machine, pointed at the Neon database:
DATABASE_URL="<neon-pooled-url>" ALLOW_DESTRUCTIVE_SEED=1 npm run db:seed
```

It creates the single admin login:

- email: `sarwaralii785@gmail.com`
- password: `sarwar123`  ← change this in the portal after first login

## 5. Verify

- `https://<your-app>/` loads the public site.
- `/login` → sign in with the admin account → `/admin` loads.
- Public pages end any active session by design (`proxy.ts`).

## Useful scripts

| Command          | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `npm run dev`    | Local dev server.                              |
| `npm run build`  | Production build (runs `prisma generate`).     |
| `npm run db:deploy` | Apply migrations (`prisma migrate deploy`). |
| `npm run db:seed`   | Reset data + create admin (destructive, see §4). |
| `npm run db:studio` | Prisma Studio.                              |

## Notes

- **File uploads** (assignment attachments/submissions) are stored as bytes in
  Postgres — keep uploads small. Server Actions default to a 1 MB body limit.
- **Never run `db:seed` against production** unless you intend to wipe all data;
  the script refuses non-local databases unless `ALLOW_DESTRUCTIVE_SEED=1` is set.
