-- Universal RSS-to-Blogger Autoblogging Platform
-- Run this SQL in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Feeds table
CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blogs table (Blogger blogs)
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id TEXT NOT NULL,
  blog_name TEXT NOT NULL,
  blog_url TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, blog_id)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES feeds(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  rewritten_title TEXT,
  rewritten_content TEXT,
  meta_description TEXT,
  tags TEXT[],
  blogger_post_id TEXT,
  blogger_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('bluesky', 'mastodon', 'tumblr', 'pixelfed')),
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  instance_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_shared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  blogger_access_token TEXT,
  blogger_refresh_token TEXT,
  selected_blog_id TEXT,
  ai_prompt TEXT,
  auto_publish BOOLEAN NOT NULL DEFAULT TRUE,
  auto_share BOOLEAN NOT NULL DEFAULT TRUE,
  auto_fetch_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fetch_interval_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Feeds RLS
CREATE POLICY "Users can manage their own feeds"
  ON feeds FOR ALL USING (auth.uid() = user_id);

-- Blogs RLS
CREATE POLICY "Users can manage their own blogs"
  ON blogs FOR ALL USING (auth.uid() = user_id);

-- Posts RLS
CREATE POLICY "Users can manage their own posts"
  ON posts FOR ALL USING (auth.uid() = user_id);

-- Social accounts RLS
CREATE POLICY "Users can manage their own social accounts"
  ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- Settings RLS
CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL USING (auth.uid() = user_id);

-- Logs RLS
CREATE POLICY "Users can view their own logs"
  ON logs FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_source_url ON posts(user_id, source_url);
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(user_id, created_at DESC);
