# AutoBlog Platform — Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE (all backend)                                     │
│                                                             │
│  PostgreSQL DB ──── Auth ──── pg_cron scheduler            │
│       │                           │                        │
│       │                           │ HTTP call (hourly)     │
│       └───── Row Level Security   ↓                        │
│                             /api/cron/fetch-feeds          │
└─────────────────────────────────────────────────────────────┘
              ↑ reads/writes data        ↑ API routes
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (frontend only — Hobby plan)                       │
│                                                             │
│  Next.js 15  ──── API Routes  ──── Supabase SSR Auth       │
│  (static pages + server components)                        │
└─────────────────────────────────────────────────────────────┘
```

**Key point:** Vercel hosts the Next.js app (no cron jobs needed). Supabase's built-in `pg_cron` scheduler triggers your app's API endpoint on a schedule — free on all Supabase plans.

---

## Step 1 — Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) → create a new project.
2. In **SQL Editor**, run these files in order:

   **If this is a fresh setup:**
   - `database-schema.sql`
   - `database-migration-auto-fetch.sql`

   **If you already had the schema:**
   - `database-migration-auto-fetch.sql` only

3. Go to **Settings → API** and save:

| Value | Variable name |
|-------|---------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon / public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role / secret key | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key bypasses Row Level Security. Never expose it in client code or commit it to git.

---

## Step 2 — Google OAuth (Blogger API)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create a new project.
2. **APIs & Services → Library** → enable **Blogger API v3**.
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Type: **Web application**.
5. **Authorized Redirect URIs** — add both:
   - `http://localhost:5000/api/blogs/callback`
   - `https://your-app.vercel.app/api/blogs/callback`
6. Copy **Client ID** → `GOOGLE_CLIENT_ID`
7. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## Step 3 — Generate a Cron Secret

This is a password that protects your auto-fetch endpoint from unauthorized calls.

```bash
# Run in any terminal (or use any random string generator):
openssl rand -hex 32
```

Save the output as `CRON_SECRET`.

---

## Step 4 — Deploy to Vercel (Hobby Plan)

### Option A — GitHub (recommended)

1. Push your code to a GitHub repository.
2. [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `CRON_SECRET` | Your generated secret |

4. Click **Deploy**. Note your deployment URL (e.g. `https://my-autoblog.vercel.app`).

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add CRON_SECRET
vercel --prod
```

---

## Step 5 — Enable Supabase pg_cron Scheduler

This replaces Vercel cron entirely — Supabase calls your API on a schedule for free.

1. Open `database-migration-cron-schedule.sql` in this project.
2. Replace the two placeholders at the top:
   - `YOUR_APP_URL` → your Vercel deployment URL (e.g. `my-autoblog.vercel.app`)
   - `YOUR_CRON_SECRET` → the value you set for `CRON_SECRET`
3. Run the edited SQL in **Supabase → SQL Editor**.

**Verify it worked:**
```sql
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'autoblog-fetch-feeds';
```

**Test the endpoint manually:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/fetch-feeds
```

**Check execution history in Supabase:**
```sql
SELECT start_time, status, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'autoblog-fetch-feeds')
ORDER BY start_time DESC
LIMIT 10;
```

### Change the schedule

Edit `database-migration-cron-schedule.sql` and re-run, or update directly in Supabase:

| Interval | Cron expression |
|----------|----------------|
| Every 1 hour | `0 * * * *` |
| Every 2 hours | `0 */2 * * *` |
| Every 3 hours | `0 */3 * * *` |
| Every 6 hours | `0 */6 * * *` |
| Every 12 hours | `0 */12 * * *` |
| Once a day (8am UTC) | `0 8 * * *` |

---

## Step 6 — Post-Deployment

### Update Google OAuth redirect URI

In Google Cloud Console → Credentials → your OAuth client:
- Confirm `https://your-app.vercel.app/api/blogs/callback` is listed.

### First-time dashboard setup

1. Register / sign in at your deployed URL.
2. **Settings** → paste your [Gemini API key](https://aistudio.google.com/apikey) → Save.
3. **Blogs** → Connect Blogger → authorize via Google.
4. **Feeds** → add your RSS feed URLs.
5. **Settings** → turn on **Auto-Fetch**, choose interval → Save.
6. **Settings** → turn on **Auto Publish to Blogger** → Save.

New posts will now be fetched from RSS, rewritten by Gemini AI, and published to Blogger automatically on the schedule you set.

---

## Local Development (Replit)

Add secrets in **Replit → Secrets** (wrench icon → Secrets tab):

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Your Replit app URL (shown after Run) |
| `CRON_SECRET` | Your cron secret |

The app starts on port 5000. To trigger auto-fetch manually in dev:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:5000/api/cron/fetch-feeds
```

---

## Environment Variables Reference

| Variable | Where to get it | Required |
|----------|----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ Always |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ Always |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | ✅ For cron |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | ✅ For Blogger |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | ✅ For Blogger |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL | ✅ For OAuth |
| `CRON_SECRET` | Generate with `openssl rand -hex 32` | ✅ For cron |

---

## Troubleshooting

**"Gemini API key not configured"**
→ Go to Settings in the dashboard and save your Gemini API key.

**"Cannot connect to Blogger"**
→ Check `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and that the redirect URI is correct in Google Cloud Console.

**Auto-fetch not running**
→ Check Supabase SQL Editor: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`
→ Verify `pg_net` extension is enabled: Supabase → Database → Extensions.
→ Confirm `CRON_SECRET` in your Vercel env vars matches what's in the pg_cron SQL.

**Auth / login not working**
→ Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly.
→ Confirm the database schema SQL has been run.

**Posts not publishing to Blogger**
→ Check Activity Log in the dashboard for error details.
→ Common causes: expired Blogger token (re-connect in Blogs page), no default blog selected in Settings.
