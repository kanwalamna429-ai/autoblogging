import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBlogPost, updateBlogPost, refreshAccessToken } from "@/lib/blogger";
import { shareToBluesky } from "@/lib/bluesky";
import { shareToMastodon } from "@/lib/mastodon";
import { shareToTumblr } from "@/lib/tumblr";
import { shareToPixelfed } from "@/lib/pixelfed";
import { extractExcerpt } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { postId: string };

  if (!body.postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const [postResult, settingsResult] = await Promise.all([
    supabase.from("posts").select("*").eq("id", body.postId).eq("user_id", user.id).single(),
    supabase.from("settings").select("*").eq("user_id", user.id).single(),
  ]);

  if (postResult.error || !postResult.data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const post = postResult.data;
  const settings = settingsResult.data;

  if (!settings?.blogger_access_token || !settings?.selected_blog_id) {
    return NextResponse.json(
      { error: "Blogger not connected. Please connect your Blogger account in the Blogs section." },
      { status: 400 }
    );
  }

  if (!post.rewritten_content || !post.rewritten_title) {
    return NextResponse.json(
      { error: "Post has no rewritten content to publish" },
      { status: 400 }
    );
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
    if (post.blogger_post_id) {
      bloggerPost = await updateBlogPost(
        accessToken,
        settings.selected_blog_id,
        post.blogger_post_id,
        post.rewritten_title,
        post.rewritten_content,
        post.tags || []
      );
    } else {
      bloggerPost = await createBlogPost(
        accessToken,
        settings.selected_blog_id,
        post.rewritten_title,
        post.rewritten_content,
        post.tags || []
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("logs").insert({
      user_id: user.id,
      action: "Blogger publish failed",
      message: `"${post.rewritten_title}": ${msg}`,
      status: "failed",
    });
    await supabase.from("posts").update({ status: "failed" }).eq("id", post.id);
    return NextResponse.json({ error: `Blogger publish failed: ${msg}` }, { status: 500 });
  }

  const { data: updatedPost } = await supabase
    .from("posts")
    .update({
      blogger_post_id: bloggerPost.id,
      blogger_url: bloggerPost.url,
      status: "published",
    })
    .eq("id", post.id)
    .select()
    .single();

  await supabase.from("logs").insert({
    user_id: user.id,
    action: "Blogger published",
    message: `"${post.rewritten_title}" → ${bloggerPost.url}`,
    status: "success",
  });

  if (settings.auto_share) {
    const { data: socialAccounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true);

    const excerpt = extractExcerpt(post.rewritten_content, 200);

    for (const account of socialAccounts || []) {
      let shareResult;

      if (account.platform === "bluesky") {
        const [identifier, password] = account.access_token.split("|:|");
        shareResult = await shareToBluesky(identifier, password, post.rewritten_title, excerpt, bloggerPost.url);
      } else if (account.platform === "mastodon") {
        shareResult = await shareToMastodon(
          account.instance_url || "",
          account.access_token,
          post.rewritten_title,
          excerpt,
          bloggerPost.url
        );
      } else if (account.platform === "tumblr") {
        const [blogId, token] = account.access_token.split("|:|");
        shareResult = await shareToTumblr(token, blogId, post.rewritten_title, excerpt, bloggerPost.url);
      } else if (account.platform === "pixelfed") {
        shareResult = await shareToPixelfed(
          account.instance_url || "",
          account.access_token,
          "",
          post.rewritten_title,
          bloggerPost.url
        );
      }

      if (shareResult) {
        const platformName = account.platform.charAt(0).toUpperCase() + account.platform.slice(1);
        if (shareResult.success) {
          await supabase.from("logs").insert({
            user_id: user.id,
            action: `${platformName} shared`,
            message: `"${post.rewritten_title}"`,
            status: "success",
          });
          await supabase.from("social_accounts").update({ last_shared_at: new Date().toISOString() }).eq("id", account.id);
        } else {
          await supabase.from("logs").insert({
            user_id: user.id,
            action: `${platformName} share failed`,
            message: shareResult.error || "Unknown error",
            status: "failed",
          });
        }
      }
    }
  }

  return NextResponse.json({ data: updatedPost, success: true });
}
