# Aura Style — Deployment Guide (Vercel)

Your repo is live at: **https://github.com/admaneraju999-code/aura-style**

Vercel is pre-configured (`vercel.json`) and the CV + outfit-generation code
is already committed. Two things remain: create a database, and link the repo
in Vercel.

---

## Step 1 — Create a Postgres database

The app needs a Postgres connection string. Two free options:

### Option A: Vercel Postgres (now powered by Neon) — recommended

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account).
2. From the dashboard click **Storage** in the left sidebar.
3. Click **Create Database** → select **Postgres** → choose a region close to you.
4. After creation, open the database. You'll see a **connection string**
   (starts with `postgres://...`). **Copy it.** This is your `POSTGRES_URL`.

### Option B: Neon (standalone)

1. Go to [neon.tech](https://neon.tech), sign up free.
2. Create a project, copy the **connection string** (`.env` style / pooled URL).
   - Recommended: use the **pooled** URL (adds `-pooler` host) to avoid
     connection limits on serverless.

> You won't need to run `npm run db:init` — the schema auto-creates on the
> first API request, and the app auto-migrates existing tables with the new
> `sub_category` / `formality` / `style_tags` columns.

---

## Step 2 — Import the repo into Vercel

1. On [vercel.com](https://vercel.com) click **Add New → Project**.
2. Choose **Import** from **GitHub** (you may need to install the Vercel GitHub
   app and grant access to `admaneraju999-code/aura-style`).
3. Vercel auto-detects it as a **Node.js** project (`package.json`). No changes
   needed to the build settings.
4. **Environment Variables** — click **Add** and enter:
   | Name          | Value                                |
   |---------------|--------------------------------------|
   | `POSTGRES_URL`| (the connection string from Step 1)  |
5. Click **Deploy**.

---

## Step 3 — Verify

Once deployed, open your project URL and check:

- `https://<your-app>.vercel.app/` → Wardrobe page loads
- `https://<your-app>.vercel.app/api` → health JSON with table counts
- `https://<your-app>.vercel.app/outfit-builder.html` → after you scan a few
  items, AI outfit combinations appear

You can also test the new endpoint directly:

- `GET /api/outfit-generate` → generated outfits (needs wardrobe items)
- `GET /api/outfit-generate?occasion=Evening` → filtered by occasion

---

## Local development (code changes)

```bash
npm run dev        # http://localhost:8787
```

Point it at a local Postgres by copying `.env.local.example` → `.env.local`
and setting `POSTGRES_URL`. Run tests with `npm test`.

---

## Redeploying after changes

Since the repo is Git-linked, every `git push` to `master` auto-deploys:

```bash
git add -A
git commit -m "your message"
git push
```

---

## Troubleshooting

- **`POSTGRES_URL` not found / 500 on `/api`** — make sure the env var is set in
  Vercel **Settings → Environment Variables** and click **Redeploy**.
- **Outfit Builder shows "No wardrobe items yet"** — scan (or add) at least a
  top + a bottom. The engine needs items in ≥2 categories.
- **Sharp install fails on Vercel** — it pre-builds for the serverless runtime;
  if it ever errors, add the `sharp` version from `package.json` to the
  project's build settings. Usually nothing needed.
