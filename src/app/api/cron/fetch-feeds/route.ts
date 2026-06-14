import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processFeed } from "@/lib/feed-processor";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured. Add it in Replit Secrets." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "") || request.nextUrl.searchParams.get("secret");

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: allSettings, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .eq("auto_fetch_enabled", true);

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  if (!allSettings || allSettings.length === 0) {
    return NextResponse.json({ message: "No users with auto-fetch enabled", processed: 0, success: true });
  }

  const results: Array<{
    userId: string;
    feedId: string;
    feedName: string;
    processed: number;
    published: number;
    failed: number;
    skipped: number;
    error?: string;
  }> = [];

  for (const settings of allSettings) {
    if (!settings.gemini_api_key) continue;

    const intervalHours = (settings as { fetch_interval_hours?: number }).fetch_interval_hours || 6;
    const cutoffTime = new Date(Date.now() - intervalHours * 60 * 60 * 1000).toISOString();

    const { data: feeds } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", settings.user_id)
      .eq("active", true)
      .or(`last_fetched_at.is.null,last_fetched_at.lt.${cutoffTime}`);

    if (!feeds || feeds.length === 0) continue;

    for (const feed of feeds) {
      try {
        const result = await processFeed(supabase, settings.user_id, feed, settings);
        results.push({
          userId: settings.user_id,
          feedId: feed.id,
          feedName: feed.name,
          ...result,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({
          userId: settings.user_id,
          feedId: feed.id,
          feedName: feed.name,
          processed: 0,
          published: 0,
          failed: 1,
          skipped: 0,
          error: msg,
        });
      }
    }
  }

  const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
  const totalPublished = results.reduce((sum, r) => sum + r.published, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  return NextResponse.json({
    success: true,
    message: `Auto-fetch complete: ${totalPublished} published from ${results.length} feeds`,
    totalProcessed,
    totalPublished,
    totalFailed,
    feeds: results.length,
    details: results,
  });
}
