-- AutoBlog — Supabase pg_cron Scheduler
-- Run this in your Supabase SQL Editor AFTER deploying your app to Vercel.
-- Replace the two placeholder values before running.
--
-- BEFORE RUNNING:
--   1. Replace YOUR_APP_URL with your actual deployed URL
--      e.g. https://my-autoblog.vercel.app
--   2. Replace YOUR_CRON_SECRET with the value you set in CRON_SECRET env var

-- Step 1: Enable the pg_net extension (makes outbound HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: pg_cron is already enabled on all Supabase projects.
-- If you get an error, enable it at:
-- Supabase Dashboard → Database → Extensions → search "pg_cron" → Enable

-- Step 3: Remove any previous schedule with the same name (safe to re-run)
SELECT cron.unschedule('autoblog-fetch-feeds') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'autoblog-fetch-feeds'
);

-- Step 4: Create the scheduled job
-- Runs every hour. Change the schedule expression to match your fetch_interval_hours setting:
--   Every 1 hour:  '0 * * * *'
--   Every 2 hours: '0 */2 * * *'
--   Every 3 hours: '0 */3 * * *'
--   Every 6 hours: '0 */6 * * *'
--   Every 12 hours:'0 */12 * * *'
--   Once a day:    '0 8 * * *'   (8am UTC)

SELECT cron.schedule(
  'autoblog-fetch-feeds',
  '0 * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://YOUR_APP_URL/api/cron/fetch-feeds',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    )
  ) AS request_id;
  $$
);

-- Verify the job was created:
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'autoblog-fetch-feeds';

-- -------------------------------------------------------
-- To pause auto-fetch without deleting:
--   UPDATE cron.job SET active = false WHERE jobname = 'autoblog-fetch-feeds';
--
-- To resume:
--   UPDATE cron.job SET active = true WHERE jobname = 'autoblog-fetch-feeds';
--
-- To remove completely:
--   SELECT cron.unschedule('autoblog-fetch-feeds');
--
-- To check recent execution history:
--   SELECT * FROM cron.job_run_details WHERE jobid = (
--     SELECT jobid FROM cron.job WHERE jobname = 'autoblog-fetch-feeds'
--   ) ORDER BY start_time DESC LIMIT 10;
-- -------------------------------------------------------
