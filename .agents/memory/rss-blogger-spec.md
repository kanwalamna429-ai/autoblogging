---
name: RSS-to-Blogger Autoblogging Platform Spec
description: Full specification for the Universal RSS-to-Blogger autoblogging SaaS platform
---

# Project Spec: Universal RSS-to-Blogger Autoblogging Platform

## Tech Stack (STRICT - do not change)
- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI
- Backend: Next.js API Routes, Server Actions
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- AI: Google Gemini API
- Deployment: Vercel
- Storage: Supabase Storage

## Core Workflow (no scheduling, no queues, no delays)
RSS Feed → AI Rewrite → Blogger Publish → Social Distribution (all immediate)

## Database Tables
users, blogs, feeds, posts, social_accounts, settings, logs

## Dashboard Pages
overview, feeds, posts, blogs, social, settings, analytics

## Social Platforms
Bluesky, Mastodon, Tumblr, Pixelfed

## Key Rules
- No mock data, no placeholder logic, no TODOs
- TypeScript everywhere, strict typing
- Production ready, full implementation
- Server-side API calls only
- Encrypt API keys, secure OAuth tokens
- Dark mode + Light mode support
