# AutoBlog Platform — Deployment Guide

## Overview

AutoBlog is a Next.js 15 app. Deploy it on **Vercel** (recommended — free tier works) for automatic cron support and global edge delivery.

---

## Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **SQL Editor** and run **both** SQL files in order:
   - `database-schema.sql` — creates all tables (run this first if new)
   - `database-migration-auto-fetch.sql` — adds auto-fetch columns (run if you already had the schema)
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` private. Never expose it in client-side code.

---

## Step 2 — Google OAuth (for Blogger)

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a new project.
2. Navigate to **APIs & Services → Library** and enable:
   - **Blogger API v3**
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Choose **Web application**.
5. Add **Authorized Redirect URIs**:
   - `http://localhost:5000/api/blogs/callback` (for local dev)
   - `https://your-app.vercel.app/api/blogs/callback` (for production)
6. Copy **Client ID** → `GOOGLE_CLIENT_ID`
7. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## Step 3 — Generate a Cron Secret

Run this in your terminal to generate a secure random string:

```bash
openssl rand -hex 32
```

Save this as `CRON_SECRET`. You'll need it later.

---

## Step 4 — Local Development (Replit)

Add all secrets in **Replit → Secrets**:

| Secret | Value |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-replit-app.replit.app` |
| `CRON_SECRET` | Your generated random string |

Then click **Run** — the app starts on port 5000.

---

## Step 5 — Deploy to Vercel

### Option A: Deploy from GitHub (recommended)

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Add all environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `CRON_SECRET` | Your cron secret |

4. Click **Deploy**.

### Option B: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and set env vars with:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... repeat for all variables
vercel --prod
```

---

## Step 6 — Post-Deployment

### Update Google OAuth redirect URI

In Google Cloud Console → Credentials → your OAuth Client:
- Add `https://your-app.vercel.app/api/blogs/callback` as an authorized redirect URI.

### Verify Cron is Running

Vercel automatically reads `vercel.json` and schedules the cron endpoint at:
```
GET /api/cron/fetch-feeds
```
It runs every hour (`0 * * * *`). You can view cron executions in:
**Vercel Dashboard → your project → Settings → Cron Jobs**

To test the cron manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/fetch-feeds
```

### First-Time User Setup (in the dashboard)

1. Register/sign in at your deployed URL.
2. Go to **Settings** → paste your [Gemini API key](https://aistudio.google.com/apikey).
3. Go to **Blogs** → click **Connect Blogger** → authorize via Google.
4. Go to **Feeds** → add your RSS feed URLs.
5. Go to **Settings** → enable **Auto-Fetch** and choose your interval.
6. Go to **Settings** → enable **Auto Publish to Blogger**.
7. Save settings — new posts will now be fetched, rewritten, and published automatically.

---

## Architecture

```
RSS Feed(s)
    ↓  (every N hours via Vercel Cron or manual Fetch)
/api/cron/fetch-feeds  or  /api/feeds/process
    ↓
Google Gemini AI  →  rewrites content to HTML
    ↓
Blogger API  →  publishes live post
    ↓
Social APIs  →  Bluesky / Mastodon / Tumblr / Pixelfed
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ for cron | Supabase service role key (server only) |
| `GOOGLE_CLIENT_ID` | ✅ for Blogger | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ for Blogger | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full URL of your deployed app |
| `CRON_SECRET` | ✅ for cron | Secret token to authenticate cron calls |

---

## Troubleshooting

**"Gemini API key not configured"** — Go to Settings in the dashboard and save your Gemini API key.

**"Cannot connect to Blogger"** — Check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and that your redirect URI is added in Google Cloud Console.

**Cron not running** — Verify `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel env vars. Check Vercel → Settings → Cron Jobs.

**Auth not working** — Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct and that the database schema has been run.

**Posts not publishing** — In the dashboard, check the **Activity Log** for error details. Common causes: expired Blogger token (re-connect in Blogs page), no blog selected in settings.
