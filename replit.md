# Universal RSS-to-Blogger Autoblogging Platform

A full-stack SaaS application that automatically imports content from RSS feeds, rewrites it using Google Gemini AI, publishes it to Blogger, and distributes it across social platforms.

## Tech Stack

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Deployment**: Vercel

## Core Workflow

RSS Feed → Gemini AI Rewrite → Blogger Publish → Social Distribution (all immediate, no scheduling)

## Setup Instructions

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL from `database-schema.sql` in your Supabase SQL Editor
3. Copy your project URL and anon key

### 2. Google OAuth Setup (for Blogger)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Blogger API v3**
4. Create OAuth 2.0 credentials (Web application)
5. Add your app URL + `/api/blogs/callback` as an authorized redirect URI

### 3. Environment Variables
Set these in Replit Secrets or `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
```

### 4. Gemini API Key
Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey) and add it in the Settings page.

## Features

- ✅ Multi-blog Blogger support via Google OAuth
- ✅ Multiple RSS feeds with manual fetch
- ✅ AI rewriting with Google Gemini (custom prompts)
- ✅ Duplicate detection (skips already-processed URLs)
- ✅ Auto-publish to Blogger
- ✅ Social sharing: Bluesky, Mastodon, Tumblr, Pixelfed
- ✅ Full dashboard: Overview, Feeds, Posts, Blogs, Social, Analytics, Settings
- ✅ Dark/Light mode
- ✅ Activity logs

## User Preferences

- Use the specified tech stack exactly (Next.js 15, Supabase, Gemini, Tailwind, Shadcn UI)
- No mock data, no placeholder logic
- Production-ready TypeScript throughout
