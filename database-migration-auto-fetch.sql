-- Auto-Fetch Migration
-- Run this in your Supabase SQL Editor to add auto-fetch support

-- Add last_fetched_at to feeds table
ALTER TABLE feeds
  ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMPTZ;

-- Add auto-fetch settings to settings table
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS auto_fetch_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fetch_interval_hours INTEGER NOT NULL DEFAULT 6;

-- Index for cron query (find feeds due for fetching)
CREATE INDEX IF NOT EXISTS idx_feeds_last_fetched ON feeds(user_id, last_fetched_at);

-- Index for cron query (find users with auto-fetch enabled)
CREATE INDEX IF NOT EXISTS idx_settings_auto_fetch ON settings(auto_fetch_enabled) WHERE auto_fetch_enabled = TRUE;
