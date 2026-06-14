import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processFeed } from "@/lib/feed-processor";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { feedId: string };

  if (!body.feedId) {
    return NextResponse.json({ error: "feedId is required" }, { status: 400 });
  }

  const [feedResult, settingsResult] = await Promise.all([
    supabase.from("feeds").select("*").eq("id", body.feedId).eq("user_id", user.id).single(),
    supabase.from("settings").select("*").eq("user_id", user.id).single(),
  ]);

  if (feedResult.error || !feedResult.data) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  const feed = feedResult.data;
  const settings = settingsResult.data;

  if (!settings?.gemini_api_key) {
    return NextResponse.json({ error: "Gemini API key not configured in Settings" }, { status: 400 });
  }

  try {
    const result = await processFeed(supabase, user.id, feed, settings);
    return NextResponse.json({ ...result, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
