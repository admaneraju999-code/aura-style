# Aura Style — Backend + Front-end

A single-user fashion Computer Vision app. Static HTML front-end + a
Node.js serverless API that runs on **Vercel** with a **Postgres** database.

No authentication — the app is a personal wardrobe.

---

## Features

- **Wardrobe (home)** — list / add / edit / delete clothing items (`/api/wardrobe`)
- **Scan New Item** — upload a photo; the CV helper auto-detects the dominant
  color, category (tops/bottoms/outerwear/shoes/accessories), sub-category
  (e.g. "blazer", "jeans"), formality level, and style tags. User can review
  and correct before saving (`/api/scan`)
- **Outfit Builder** — AI generates outfit combinations from your wardrobe using
  color harmony rules, formality matching, and outfit templates. Filter by
  occasion (Casual, Business, Evening, etc.). Save your favorite combos
  (`/api/outfit-generate`)
- **Discovery** — inspirations feed with favorites (`/api/discovery`)
- **Settings** — persist profile/theme/etc. (`/api/settings`)

## API overview

| Method | Path                  | Description                      |
|--------|-----------------------|----------------------------------|
| GET    | `/api`                | Health + table counts            |
| GET    | `/api/wardrobe`       | List all wardrobe items          |
| POST   | `/api/wardrobe`       | Create an item                   |
| GET    | `/api/wardrobe/:id`   | Get one item                     |
| PATCH  | `/api/wardrobe/:id`   | Update an item                   |
| DELETE | `/api/wardrobe/:id`   | Delete an item                   |
| GET    | `/api/outfit-generate`| Auto-generate outfits from wardrobe |
| GET    | `/api/outfits`        | List outfits                     |
| POST   | `/api/outfits`        | Create an outfit                 |
| PATCH  | `/api/outfits/:id`    | Update an outfit                 |
| DELETE | `/api/outfits/:id`    | Delete an outfit                 |
| GET    | `/api/discovery`      | List inspirations (seeds on first call) |
| PATCH  | `/api/discovery/:id`  | Set / toggle favorite            |
| GET    | `/api/settings`       | Get settings                     |
| PUT    | `/api/settings`       | Update settings                  |
| POST   | `/api/scan`           | Upload image → color + category + preview (multipart) |

---

## Getting started locally

Requires **Node 18+** and a Postgres connection string.

### 1. Install

```bash
npm install
```

### 2. Create the database

Create a Postgres instance — either **Vercel Postgres**/Neon (recommended, since
you'll deploy to Vercel anyway) or any Postgres. Then copy the template:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your connection URL:

```
POSTGRES_URL=postgresql://user:password@host:port/database
```

### 3. Create tables

```bash
npm run db:init
```

### 4. Run the dev server

```bash
npm run dev
```

Open **http://localhost:8787/index.html**. The API lives at the same origin, so
the front-end talks to `/api/*` with no extra config.

> Note: the tables are also created automatically on first API request, so this
> step is only needed if you want to seed ahead of time.

---

## Deploying to Vercel

### Option A — Vercel Postgres (quickest)

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo.
   - Vercel auto-detects it as a Node project (`package.json`).
   - The static pages in the root serve automatically; the `api/` folder becomes
     serverless functions.
3. Attach a database:
   - **Databases → Create** (now backed by **Neon**), or
   - Use the **Vercel Postgres** integration.
4. Copy the generated connection string into:
   - **Settings → Environment Variables → `POSTGRES_URL`**
5. **Deploy.** Done.
6. Open the deployed URL — the seed inspirations appear automatically.

### Option B — Neon (any Postgres)

1. Create a free Neon project, copy the connection string.
2. On Vercel, add `POSTGRES_URL` as an environment variable.
3. Deploy.

### Keeping the database in sync

Vercel's serverless environment has no persistent disk and each function is
stateless — that's exactly why **Postgres is the source of truth**.

---

## Computer Vision ("Scan New Item")

The scan endpoint (`/api/scan`) uses **Sharp** to:

1. Decode the uploaded photo.
2. Compute the **dominant color** (mapped to a friendly name, e.g. *Navy*, *Ivory*).
3. Detect **category** (top / bottom / outerwear / shoes / accessory) using
   edge density analysis, aspect ratio, region brightness profiling, and
   color distribution — a significant upgrade over pure aspect-ratio heuristics.
4. Infer **sub-category** (e.g. "blazer", "jeans", "tshirt", "dress").
5. Estimate **formality** (formal / smart / casual / sporty) based on color
   palette, brightness, and texture cues.
6. Generate **style tags** (e.g. "minimalist", "bold", "earthy", "classic").
7. Return a clean square **preview** crop.

## Outfit Generation Engine

The outfit builder (`/api/outfit-generate` + `lib/outfit-engine.js`) uses:

- **Color harmony scoring** — analogous, complementary, and neutral pairing rules
- **Formality matching** — ensures items in an outfit are from compatible
  formality levels (e.g. no sporty shoes with a formal blazer)
- **8 outfit templates** — Classic Casual, Smart Layered, Evening Ready,
  Street Style, Business Formal, Weekend Comfort, Full Stack, Accessorized Look
- **Scored combinations** — each outfit is scored 0-100 based on color harmony,
  formality consistency, variety, and contrast

---

## Project structure

```
.
├─ api/                  # Vercel serverless functions
│  ├─ index.js           # health
│  ├─ wardrobe.js        # discover & create items
│  ├─ wardrobe/[id].js
│  ├─ outfits.js
│  ├─ outfits/[id].js
│  ├─ outfit-generate.js # AI outfit generation from wardrobe
│  ├─ discovery.js
│  ├─ discovery/[id].js
│  ├─ settings.js
│  └─ scan.js            # upload + CV
├─ lib/
│  ├─ db.js              # @vercel/postgres + schema + migrations
│  ├─ cv.js              # Sharp-based color/category/formality detection
│  ├─ outfit-engine.js   # Outfit generation with color harmony + templates
│  ├─ body.js            # JSON body reader
│  └─ response.js        # JSON response helpers
├─ scripts/
│  ├─ dev-server.mjs     # local server that routes /api/* to the handlers
│  ├─ setup-db.js        # creates tables + migrations
│  └─ load-env.mjs
├─ js/
│  ├─ api.js             # front-end fetch wrapper
│  ├─ wardrobe.js        # loads & renders the Wardrobe grid
│  ├─ outfit-suggestions.js  # renders AI-generated outfit combos
│  ├─ outfits.js         # outfit save/share management
│  ├─ scan.js            # scan modal + CV result review
│  ├─ filters.js
│  └─ animations.js
├─ tests/
│  ├─ scan.test.mjs          # multipart + CV pipeline (no DB needed)
│  └─ validation.test.mjs    # route validation paths (no DB needed)
├─ css/
├─ *.html               # the static pages
├─ vercel.json
└─ package.json
```

## Tests

```bash
npm test
```

The tests cover the CV/multipart scan pipeline and the API validation paths
without needing a database. Full CRUD happy-paths require a real Postgres
(i.e. they use the running local dev server against a configured DB).
