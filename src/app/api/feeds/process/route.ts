import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAndParseRSS } from "@/lib/rss";
import { rewriteContent } from "@/lib/gemini";
import { createBlogPost, refreshAccessToken } from "@/lib/blogger";
import { shareToBluesky } from "@/lib/bluesky";
import { shareToMastodon } from "@/lib/mastodon";
import { shareToTumblr } from "@/lib/tumblr";
import { shareToPixelfed } from "@/lib/pixelfed";
import { extractExcerpt } from "@/lib/utils";
import type { ProcessFeedResult } from "@/types/api";

async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  action: string,
  message: string,
  status: "success" | "failed"
) {
  await supabase.from("logs").insert({ user_id: userId, action, message, status });
}

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

  const result: ProcessFeedResult = { processed: 0, published: 0, failed: 0, skipped: 0, errors: [] };

  let items;
  try {
    items = await fetchAndParseRSS(feed.feed_url);
    await logAction(supabase, user.id, "Feed fetched", `Fetched ${items.length} items from ${feed.name}`, "success");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logAction(supabase, user.id, "Feed fetch failed", `${feed.name}: ${msg}`, "failed");
    return NextResponse.json({ error: `Failed to fetch feed: ${msg}` }, { status: 500 });
  }

  for (const item of items.slice(0, 5)) {
    if (!item.url) {
      result.skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_url", item.url)
      .maybeSingle();

    if (existing) {
      result.skipped++;
      continue;
    }

    result.processed++;

    let rewritten;
    try {
      rewritten = await rewriteContent(
        item.title,
        item.content || item.title,
        settings.gemini_api_key,
        settings.ai_prompt || undefined
      );
      await logAction(supabase, user.id, "Article rewritten", `"${item.title}"`, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.failed++;
      result.errors.push(`Rewrite failed for "${item.title}": ${msg}`);
      await logAction(supabase, user.id, "Rewrite failed", `"${item.title}": ${msg}`, "failed");

      await supabase.from("posts").insert({
        user_id: user.id,
        feed_id: feed.id,
        source_url: item.url,
        source_title: item.title,
        status: "failed",
      });
      continue;
    }

    const { data: savedPost } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        feed_id: feed.id,
        source_url: item.url,
        source_title: item.title,
        rewritten_title: rewritten.title,
        rewritten_content: rewritten.content,
        meta_description: rewritten.metaDescription,
        tags: rewritten.tags,
        status: "draft",
      })
      .select()
      .single();

    if (!savedPost) {
      result.failed++;
      continue;
    }

    if (!settings.auto_publish || !settings.selected_blog_id || !settings.blogger_access_token) {
      continue;
    }

    let accessToken = settings.blogger_access_token;

    if (settings.blogger_refresh_token) {
      try {
        accessToken = await refreshAccessToken(settings.blogger_refresh_token);
        await supabase.from("settings").update({ blogger_access_token: accessToken }).eq("user_id", user.id);
      } catch {
        // use existing token
      }
    }

    let bloggerPost;
    try {
      bloggerPost = await createBlogPost(
        accessToken,
        settings.selected_blog_id,
        rewritten.title,
        rewritten.content,
        rewritten.tags
      );

      await supabase.from("posts").update({
        blogger_post_id: bloggerPost.id,
        blogger_url: bloggerPost.url,
        status: "published",
      }).eq("id", savedPost.id);

      await logAction(supabase, user.id, "Blogger published", `"${rewritten.title}" → ${bloggerPost.url}`, "success");
      result.published++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await supabase.from("posts").update({ status: "failed" }).eq("id", savedPost.id);
      await logAction(supabase, user.id, "Blogger publish failed", `"${rewritten.title}": ${msg}`, "failed");
      result.failed++;
      continue;
    }

    if (!settings.auto_share || !bloggerPost) continue;

    const excerpt = extractExcerpt(rewritten.content, 200);
    const socialAccounts = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true);

    for (const account of socialAccounts.data || []) {
      let shareResult;

      if (account.platform === "bluesky") {
        const [identifier, password] = account.access_token.split("|:|");
        shareResult = await shareToBluesky(identifier, password, rewritten.title, excerpt, bloggerPost.url);
      } else if (account.platform === "mastodon") {
        shareResult = await shareToMastodon(
          account.instance_url || "",
          account.access_token,
          rewritten.title,
          excerpt,
          bloggerPost.url
        );
      } else if (account.platform === "tumblr") {
        const [blogId, token] = account.access_token.split("|:|");
        shareResult = await shareToTumblr(token, blogId, rewritten.title, excerpt, bloggerPost.url);
      } else if (account.platform === "pixelfed") {
        shareResult = await shareToPixelfed(
          account.instance_url || "",
          account.access_token,
          item.imageUrl || "",
          rewritten.title,
          bloggerPost.url
        );
      }

      if (shareResult) {
        const action = `${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} shared`;
        if (shareResult.success) {
          await logAction(supabase, user.id, action, `"${rewritten.title}"`, "success");
          await supabase.from("social_accounts").update({ last_shared_at: new Date().toISOString() }).eq("id", account.id);
        } else {
          await logAction(supabase, user.id, `${action} failed`, shareResult.error || "Unknown error", "failed");
        }
      }
    }
  }

  return NextResponse.json({ ...result, success: true });
}
