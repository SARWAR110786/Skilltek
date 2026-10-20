# SkillTek — SaaS Roadmap (Beginner Guide)

This document explains, in plain language, what your app is now, what it must
become to sell to many institutes, and exactly how to host and run it.

**Decision made:** ONE website, MANY institutes (multi-tenant SaaS).
Example: `skilltek.com/lahore-academy`, `skilltek.com/city-college`, etc.
Each institute logs in and sees ONLY its own students, teachers and fees.

---

## 1. What you have today (honest picture)

- A **single-institute** app. The `Setting` table is one row called
  `"singleton"` — one institute name, one logo, one bank account for everyone.
- One database (`User`, `Course`, `Student`, `Challan`, ...). There is no
  concept of "which institute does this row belong to".
- Hosting: **Vercel** (runs the app) + **Neon** (Postgres database).
- Android app: a TWA (wrapped website) that installs from `/download`.

This is a solid foundation. It is NOT yet safe to sell, because Institute A
could theoretically see Institute B's data. That is the core thing to fix.

---

## 2. The ONE big idea: "tenant" (= institute)

A **tenant** is one customer — one institute. To support many, every row of
data must be stamped with an `instituteId`. Then every query filters by the
logged-in user's institute.

This is called **multi-tenancy**. There are two ways to do it:

| Approach | How | Recommendation |
|---|---|---|
| **Shared tables + `instituteId` column** | All institutes in one DB, every table has `instituteId`, every query filters it | ✅ Do this. Simplest, cheapest, fits your scale |
| Schema-per-tenant | A separate Postgres schema per institute | Overkill; skip |

We use **shared tables + `instituteId`**. One database, one set of code, one
deploy. Cheap and easy to operate.

---

## 3. Database changes needed (the migration plan)

Add a new model and stamp every existing model:

```prisma
model Institute {
  id        String   @id @default(cuid())
  slug      String   @unique   // e.g. "lahore-academy" -> the URL
  name      String
  domain    String?  @unique   // optional: their own domain later
  status    String   @default("ACTIVE") // ACTIVE / SUSPENDED (unpaid)
  plan      String   @default("STARTER")
  createdAt DateTime @default(now())

  users     User[]
  courses   Course[]
  students  Student[]
  // ...relations to every tenant table
}
```

Then add to **every** tenant model (`User`, `Course`, `Teacher`, `Student`,
`Challan`, `Attendance`, `Notice`, `Enquiry`, `Quiz*`, `Assignment*`, `Setting`):

```prisma
instituteId String
institute   Institute @relation(fields: [instituteId], references: [id], onDelete: Cascade)
@@index([instituteId])
```

Important details for a careful reviewer:
- **`User.email` must not be globally `@unique` anymore** — two institutes can
  both have `admin@gmail.com`. Change it to `@@unique([instituteId, email])`.
- Same for `Student.admissionNo` and `Challan.challanNo`:
  `@@unique([instituteId, admissionNo])`, `@@unique([instituteId, challanNo])`.
- Turn `Setting` from a singleton into **one row per institute** (remove the
  `@default("singleton")` and add `instituteId @unique`).

**Migration steps (run once, carefully — you have real data):**
1. Create the `Institute` model, run `npx prisma migrate dev --name add_institute`.
2. Create ONE institute row (your SkillTek) and note its `id`.
3. Add `instituteId` as **nullable** first, backfill every existing row with
   your institute's id, THEN make it required. This avoids data loss.
4. Drop the old global unique constraints, add the per-institute ones.

> Rule: never run `prisma/seed.ts` on the live DB. It wipes data.

---

## 4. Code changes needed (tenant isolation)

1. **Session must carry `instituteId`.** When a user logs in, put their
   institute into the JWT (`src/lib/auth.ts`, `signSession`). Then
   `getSession()` returns `{ id, name, role, instituteId }`.

2. **Every DB query must filter by institute.** Today:
   ```ts
   prisma.student.findMany()
   ```
   Becomes:
   ```ts
   prisma.student.findMany({ where: { instituteId: session.instituteId } })
   ```
   The safest way is a tiny helper, e.g. `tenantWhere(session)` — so no
   developer can forget. A reviewer will look for this.

3. **Creating rows must stamp the institute.** Every `create` sets
   `instituteId: session.instituteId`.

4. **The public site becomes institute-aware.** `skilltek.com/<slug>` loads
   that institute's `Setting`, courses, and enquiry form. The root
   `skilltek.com` becomes your landing/pricing page.

5. **Students/teachers URL.** Keep `skilltek.com/<slug>/login`, or use
   subdomains `lahore.skilltek.com`. Subdomains are nicer but need wildcard
   DNS + a Vercel setting. Start with `/<slug>` — it is simpler.

6. **Admin "super panel".** YOU need a hidden area to create institutes,
   suspend non-payers, and see usage. This is a new role, e.g. `SUPERADMIN`.

---

## 5. Hosting — what to buy and why

You already use the two best beginner-friendly services. Keep them.

### Application hosting — Vercel
- **Now:** Hobby (free). Fine for building.
- **When you charge money:** **Pro, ~$20/month.** Hobby is not licensed for
  commercial use and has limits.
- Deploys automatically from `master`. Nothing to configure.

### Database — Neon (Postgres)
- **Now:** Free tier (0.5 GB).
- **When you grow:** **Launch, ~$19/month** (more storage + compute).
- Neon is in `ap-southeast-1` (Singapore). From Pakistan that adds latency.
  When you have real paying institutes, **create a new Neon project in the
  closest region** and point `DATABASE_URL`/`DIRECT_URL` at it.
- **Backups:** Neon has **Point-in-Time Restore built in**. Turn it on in the
  Neon dashboard (Project → Settings → Backups). No code needed. This is your
  "insurance policy" — do it before you have a single customer.

### Alternative all-in-one (only if you prefer one dashboard)
- **Supabase** (~$25/mo): Postgres + auth + file storage + backups together.
- Migrating costs time. Only switch if juggling two dashboards stresses you.

### File storage
- Right now uploaded assignment files are stored **inside Postgres** (`Bytes`).
  That bloats the DB and slows backups. When you grow, move files to object
  storage (Vercel Blob, Cloudflare R2, or Supabase Storage) and keep only the
  URL in the DB. Flag this to any reviewer as a known scale item.

### Domain
- Buy `skilltek.com` (or similar) from Namecheap/Cloudflare (~$10/yr) and
  connect it in Vercel → Settings → Domains. This replaces the
  `skilltek-cg41.vercel.app` address.

---

## 6. Billing (charging institutes)

You need a way to collect monthly/yearly fees from institutes.
- Easiest: **Stripe** or **Paddle** (global cards). In Pakistan, **Paymob**,
  **Safepay**, or manual **bank transfer + you activate the institute**.
- You do NOT need billing in the app on day one. Simplest launch: institute
  pays you by transfer; you flip their `Institute.status` to `ACTIVE` or
  `SUSPENDED` from your super panel. Add Stripe later.
- Suggested pricing tiers: Starter / Standard / Premium (based on students
  count, features, AI usage).

---

## 7. Production-quality checklist (what a reviewer will check)

| Item | Status | Action |
|---|---|---|
| Multi-tenant isolation | ❌ | Section 3 + 4 |
| Automated DB backups | ⚠️ | Enable Neon PITR |
| Error monitoring | ❌ | Add **Sentry** (free tier), 15-min setup |
| Real rate limiting | ⚠️ | Move from in-memory `Map` to **Upstash Redis** (works across servers) |
| Automated tests | ❌ | Add a few Playwright/unit tests so changes don't break clients |
| Legal pages | ✅ | `/privacy`, `/terms` done — add per-institute data note |
| Secrets management | ⚠️ | Keep keys in Vercel env vars, never in code |
| Staging environment | ❌ | Add a second Neon branch + Vercel preview for safe testing |
| Onboarding flow | ❌ | A guided "create your institute" wizard for new clients |
| Usage limits per plan | ❌ | Enforce student/feature limits by `plan` |

---

## 8. Step-by-step order of work (do in this order)

1. **Enable Neon backups** (10 minutes, protects everything).
2. **Buy the domain** and connect it to Vercel.
3. **Add Sentry** for error tracking.
4. **Add the `Institute` model + `instituteId` everywhere** (Sections 3–4).
   This is the biggest job — do it on a copy/branch first.
5. **Super-admin panel** to create/suspend institutes.
6. **Institute-aware public site** (`skilltek.com/<slug>`).
7. **Move rate limiting to Upstash Redis.**
8. **Add billing** (manual first, Stripe later).
9. **Add automated tests.**
10. **Move file uploads to object storage.**

---

## 9. Costs summary (monthly, when you have customers)

| Service | Cost |
|---|---|
| Vercel Pro | ~$20 |
| Neon Launch | ~$19 |
| Domain | ~$1 |
| Sentry | free–$26 |
| Upstash Redis | free–$10 |
| **Total to start** | **~$40–50/month** |

You break even with 1–2 paying institutes at typical regional pricing.

---

## 10. Glossary (plain meanings)

- **Tenant** — one customer (one institute).
- **Multi-tenancy** — one app serving many customers, each isolated.
- **Slug** — the short name in a URL (`lahore-academy`).
- **JWT** — the secure token that remembers who is logged in.
- **Migration** — a versioned change to the database structure.
- **PITR (Point-in-Time Restore)** — ability to rewind the DB to any past moment.
- **Environment variable** — a secret setting (like the DB password) kept
  outside the code.
