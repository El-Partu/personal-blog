# Personal Blog — CS Study Notes

A two-service personal blog for writing up computer-science notes: a **Next.js**
frontend and a **separate Express + MongoDB REST API**, with TypeScript
everywhere and a shared types package so the API and UI can't drift apart.

Built for long, technical posts — syntax-highlighted code in any language,
KaTeX maths, auto-generated tables of contents, and multi-part series.

---

## Contents

- [Architecture](#architecture)
- [Repo layout](#repo-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Writing posts](#writing-posts)
- [Deployment](#deployment)
- [Tests](#tests)
- [Design notes](#design-notes)
- [What's intentionally not here](#whats-intentionally-not-here)

---

## Architecture

Two independently deployable services:

```
┌────────────────────────┐         ┌───────────────────────┐        ┌──────────┐
│   Next.js (App Router) │  HTTP   │  Express REST API     │        │ MongoDB  │
│   Vercel               ├────────►│  Render / Railway/VPS ├───────►│  Atlas   │
│   :3000                │  /api   │  :4000                │Mongoose│          │
└────────────────────────┘         └───────────────────────┘        └──────────┘
             ▲                                  ▲
             └────── @blog/shared types ────────┘
```

**How the two talk.** The browser never calls the API host directly. Next.js
rewrites `/api/*` to the Express service (`next.config.ts`), so:

- there is no CORS preflight in normal operation,
- the API host can stay private,
- nothing browser-facing needs to know the backend URL.

Server Components fetch from the API directly (in-container) using `API_URL`.
Client components use relative `/api/...` paths. The API also sets a permissive
CORS policy driven by `CORS_ORIGINS` for direct calls.

**Content lives in MongoDB**, not as Markdown files in the repo. Posts are
authored in the admin panel and stored as Markdown strings, then rendered to
HTML server-side.

**Rendering.** Post pages are statically generated (`generateStaticParams`) and
kept fresh with ISR (60s default). Shiki and KaTeX run at render time on the
server, so no syntax-highlighting JavaScript is shipped to the browser.

---

## Repo layout

npm workspaces monorepo:

```
personal-blog/
├── shared/                  @blog/shared — types imported by BOTH services
│   └── src/index.ts         Post, Series, Tag, AdminUser, API envelopes
│
├── backend/                 Express + Mongoose REST API
│   ├── src/
│   │   ├── models/          Mongoose schemas (Post, Series, Tag, AdminUser)
│   │   ├── db/              Storage drivers (see note below)
│   │   ├── controllers/     Route handlers
│   │   ├── routes/          public / auth / admin routers
│   │   ├── services/        Query + business logic
│   │   ├── middleware/      protect (JWT), validation, error handling
│   │   ├── schema/          Zod request validation
│   │   ├── serializers/     DB documents -> shared wire types
│   │   ├── scripts/seed.ts  Sample content + admin account
│   │   └── __tests__/       Vitest suites
│   └── .env                 (you create this)
│
└── frontend/                Next.js App Router
    └── src/
        ├── app/             Routes (public site + /admin)
        ├── components/      UI, incl. components/admin/*
        └── lib/
            ├── api.ts       Server-side API client
            ├── adminClient.ts  Browser API client (JWT)
            ├── markdown.ts  remark/rehype + Shiki + KaTeX pipeline
            └── site.ts      ← EDIT THIS: blog name, your links
```

### A note on the two storage drivers

`backend/src/db/` contains **two** implementations of one small `Database`
interface:

- **`mongoose.ts` — the real one.** Used whenever `MONGODB_URI` is set. The
  Mongoose schemas in `models/` are the canonical data model, including the
  weighted text index used for search.
- **`memory.ts` — a development fallback.** Used only when `MONGODB_URI` is
  empty. It implements the same interface with [`mingo`](https://github.com/kofrasa/mingo),
  which evaluates genuine MongoDB query and aggregation operators in pure
  JavaScript, and persists to `backend/.data/dev-db.json`.

This exists so you can clone the repo and have a working blog in one command
without installing MongoDB first. **Set `MONGODB_URI` for anything real** — the
in-memory driver is refused in production (the server throws if it can't reach
Mongo when `NODE_ENV=production`).

Controllers only ever see the interface, so no driver details leak into
application code.

---

## Quick start

Requires **Node 20+**.

```bash
git clone <this-repo>
cd personal-blog
npm install

# Build the shared types package once (both services import it)
npm run build:shared

# Create the admin account and 5 sample posts
npm run seed

# Start the API (:4000) and the site (:3000) together
npm run dev
```

Then open:

| URL | What |
|---|---|
| http://localhost:3000 | The blog |
| http://localhost:3000/admin | Admin panel |
| http://localhost:4000/health | API health check |

Default login: **`admin@example.com`** / **`ChangeMe123!`**
(change via `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then re-run `npm run seed`).

### Using a real MongoDB

```bash
cp .env.example backend/.env
# set MONGODB_URI, e.g.
#   mongodb://127.0.0.1:27017/personal-blog
#   mongodb+srv://user:pass@cluster0.xxx.mongodb.net/personal-blog
npm run seed        # re-seed into the real database
npm run dev
```

---

## Environment variables

Everything is documented in [`.env.example`](./.env.example). Copy it to
`backend/.env` and `frontend/.env.local`.

**Backend** (`backend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `4000` | |
| `NODE_ENV` | no | `development` | |
| `MONGODB_URI` | **in prod** | — | Empty = in-memory dev store |
| `JWT_SECRET` | **in prod** | dev fallback | `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | no | `30d` | |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated |
| `ADMIN_EMAIL` | no | `admin@example.com` | Used by the seed script |
| `ADMIN_PASSWORD` | no | `ChangeMe123!` | **Change before deploying** |
| `ADMIN_NAME` | no | `Blog Author` | |
| `CLOUDINARY_*` | no | — | All three set = uploads go to Cloudinary |

**Frontend** (`frontend/.env.local`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `API_URL` | no | `http://localhost:4000` | Server-side only |
| `NEXT_PUBLIC_SITE_URL` | for SEO | `http://localhost:3000` | Canonical/OG/RSS URLs |
| `NEXT_PUBLIC_REVALIDATE_SECONDS` | no | `60` | ISR window |

---

## Available scripts

Run from the repo root:

| Command | Does |
|---|---|
| `npm run dev` | Both services, colour-coded output |
| `npm run dev:backend` | API only |
| `npm run dev:frontend` | Site only |
| `npm run build` | Build shared → backend → frontend |
| `npm run build:shared` | Rebuild the shared types package |
| `npm run seed` | Reset sample content + upsert the admin account |
| `npm test` | Backend test suite (41 tests) |
| `npm run typecheck` | Typecheck all three packages |

> After changing anything in `shared/`, run `npm run build:shared` so both
> services pick up the new types.

---

## Data model

TypeScript interfaces live in `shared/src/index.ts` and are imported by both
services; Mongoose schemas in `backend/src/models/` mirror them. Dates are
`Date` in the database and ISO strings on the wire — the mapping happens in
`backend/src/serializers/`.

```ts
interface Post {
  _id: string;
  title: string;
  slug: string;              // unique, auto-generated, de-duplicated
  excerpt: string;           // auto-generated from content if blank
  content: string;           // Markdown
  coverImage?: string;
  status: "draft" | "published";
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  category: string;
  seriesId?: string;
  seriesOrder?: number;      // position within the series
  readTimeMinutes: number;   // computed on save
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
}
```

Plus `Series`, `Tag`, and a single-record `AdminUser` (`passwordHash` is
`select: false` and never serialized).

**Indexes.** A weighted text index (`title` ×10, `excerpt`/`tags` ×4,
`content` ×1) plus compound indexes on `status + publishedAt` and
`seriesId + seriesOrder`.

---

## API reference

Base URL: `/api/v1`. All responses use an envelope:

```jsonc
{ "status": "success", "data": { /* ... */ } }
{ "status": "fail", "message": "...", "errors": { "title": "Title is required" } }
```

### Public

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/posts` | `?page&limit&tag&category&series&q&sort` — published only |
| `GET` | `/posts/:slug` | Full post + series + prev/next navigation |
| `GET` | `/posts/:slug/related` | Ranked by shared-tag overlap |
| `POST` | `/posts/:slug/view` | Increment view counter (204) |
| `GET` | `/posts/feed/all` | All published — powers RSS + sitemap |
| `GET` | `/tags`, `/categories` | With published-post counts |
| `GET` | `/series`, `/series/:slug` | Series + its posts in order |
| `GET` | `/author` | Public profile for the About page |

`sort` accepts `newest` (default), `oldest`, `popular`.

### Auth

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/auth/login` | Rate-limited to 10 attempts / 15 min |
| `POST` | `/auth/logout` | |
| `GET` | `/auth/me` | 🔒 |
| `PATCH` | `/auth/me` | 🔒 Update name / bio / avatar |

### Admin — 🔒 all require `Authorization: Bearer <token>`

| Method | Endpoint |
|---|---|
| `GET`/`POST` | `/admin/posts` (drafts included) |
| `GET`/`PATCH`/`DELETE` | `/admin/posts/:id` |
| `GET`/`POST` | `/admin/series` |
| `PATCH`/`DELETE` | `/admin/series/:id` |
| `PATCH` | `/admin/series/:id/order` |
| `GET`/`POST` | `/admin/tags` · `DELETE /admin/tags/:id` |
| `GET`/`POST` | `/admin/uploads` · `DELETE /admin/uploads/:publicId` |

---

## Writing posts

The editor (`/admin/posts/new`) is a Markdown editor with a formatting toolbar,
live preview, and drag-and-drop image upload. `⌘/Ctrl+S` saves.

**Code blocks** — fenced, with a language tag. Highlighted by Shiki at render
time, with separate light/dark token colours:

````markdown
```python
def binary_search(arr, target):
    low, high = 0, len(arr) - 1
```
````

Supported: Python, C, C++, Java, JS/TS, Go, Rust, SQL, Bash, JSON, YAML, HTML,
CSS, asm, Haskell, Ruby, PHP, Kotlin, Swift, Scala, R, MATLAB, Lua and more
(see `LANGUAGES` in `frontend/src/lib/markdown.ts`).

**Maths** — KaTeX, inline and display:

```markdown
Inline: $O(n \log n)$

$$
T(n) = 2T\!\left(\frac{n}{2}\right) + O(n)
$$
```

**Series** — create one under `/admin/series`, then set the series and part
number on each post. Prev/next links and the series archive follow
automatically.

**Also supported**: GFM tables, task lists, footnotes, blockquotes, images.
A table of contents is auto-generated when a post has 3+ headings.

---

## Deployment

### Backend first (Render / Railway / any VPS)

The API must run as a persistent Node process — it will not work on serverless.

**Render** (similar on Railway):

1. New → Web Service → connect the repo
2. **Root directory**: `backend`
3. **Build**: `npm install && npm run build --workspace shared && npm run build`
4. **Start**: `npm start`
5. Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
   `CORS_ORIGINS=https://your-blog.vercel.app`, `ADMIN_*`, optional
   `CLOUDINARY_*`
6. Deploy, then seed the admin account once:
   `MONGODB_URI=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed`

MongoDB Atlas: create a free M0 cluster, add a database user, and allow
network access from your host (`0.0.0.0/0` for Render's dynamic IPs).

### Frontend (Vercel)

1. Import the repo
2. **Root directory**: `frontend`
3. **Build command**: `cd .. && npm run build:shared && cd frontend && next build`
4. Environment:
   - `API_URL=https://your-api.onrender.com`
   - `NEXT_PUBLIC_SITE_URL=https://your-blog.vercel.app`
5. Deploy — then add that Vercel URL to the backend's `CORS_ORIGINS`.

### Post-deploy checklist

- [ ] Change `ADMIN_PASSWORD` from the default
- [ ] `JWT_SECRET` is a long random string
- [ ] Edit `frontend/src/lib/site.ts` (blog name, your name, GitHub, LinkedIn)
- [ ] `NEXT_PUBLIC_SITE_URL` matches the real domain (used by RSS/sitemap/OG)
- [ ] Submit `/sitemap.xml` to Google Search Console

---

## Tests

```bash
npm test
```

41 Vitest tests covering the parts most worth protecting:

- **Content utilities** — slugs, read-time, excerpt truncation, and that
  `escapeRegex` stops a search query behaving as a wildcard.
- **API integration** (supertest against the real app) — pagination, tag
  filters, search; **drafts never appearing on any public route**; auth
  rejection paths and identical errors for unknown-user vs wrong-password;
  admin CRUD; slug de-duplication; **HTML sanitisation** (`<script>` and
  `onerror` stripped while code fences survive intact); series detach-on-delete.

The suite runs against the in-memory driver, so no MongoDB is needed for CI.

---

## Design notes

Editorial and content-first, with a magazine-grid homepage and a single-column
reading view.

- **Typography** — Inter for UI, Source Serif 4 for body copy at a ~68-character
  measure, JetBrains Mono for code and metadata.
- **Colour** — warm off-white paper / deep slate, one amber accent used
  sparingly. Dark mode is applied by a blocking inline script before first
  paint, so there's no flash of the wrong theme.
- **Accessibility** — semantic landmarks, skip link, visible focus rings,
  `aria-current` on active nav, live regions on async status, alt text
  throughout, and `prefers-reduced-motion` respected.
- **SEO** — per-post metadata, Open Graph + Twitter cards, JSON-LD `BlogPosting`
  schema, canonical URLs, RSS, and a sitemap covering posts, series, tags and
  categories.

Fonts load at runtime via a stylesheet `<link>` rather than `next/font`, so
`next build` never depends on reaching a third-party host — builds work
offline and on restricted networks. Local fallback stacks keep the design
intact if the webfonts never arrive. To self-host instead, swap in
`next/font/local` and drop the `<link>` tags in `app/layout.tsx`.

---

## What's intentionally not here

Out of scope per the spec, deliberately left out to avoid half-built features:

- Comments (Giscus was unchecked) · newsletter signup · scheduled publishing
- Draft/revision history · reader accounts · paywall · i18n
- Analytics dashboard — `viewCount` is tracked per post; add Plausible or GA
  if you want more

Known advisory: `npm audit` reports a build-time-only PostCSS issue reachable
solely through Next 15's toolchain. Fixing it requires a major Next upgrade;
it does not affect the deployed runtime.
