import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, listUserBlogs } from "@/lib/blogger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/blogs?error=oauth_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/blogs?error=invalid_callback", request.url));
  }

  const [, userId] = state.split(":");

  if (!userId) {
    return NextResponse.redirect(new URL("/dashboard/blogs?error=invalid_state", request.url));
  }

  const supabase = await createClient();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
  );
  const redirectUri = `${baseUrl}/api/blogs/callback`;

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabase.from("settings").update({
        blogger_access_token: tokens.access_token,
        blogger_refresh_token: tokens.refresh_token,
      }).eq("user_id", userId);
    } else {
      await supabase.from("settings").insert({
        user_id: userId,
        blogger_access_token: tokens.access_token,
        blogger_refresh_token: tokens.refresh_token,
        auto_publish: true,
        auto_share: true,
      });
    }

    const blogs = await listUserBlogs(tokens.access_token);
    for (const blog of blogs) {
      const { data: existingBlog } = await supabase
        .from("blogs")
        .select("id")
        .eq("user_id", userId)
        .eq("blog_id", blog.id)
        .maybeSingle();

      if (!existingBlog) {
        await supabase.from("blogs").insert({
          user_id: userId,
          blog_id: blog.id,
          blog_name: blog.name,
          blog_url: blog.url,
        });
      }
    }

    if (blogs.length > 0) {
      const { data: settings } = await supabase.from("settings").select("selected_blog_id").eq("user_id", userId).single();
      if (!settings?.selected_blog_id) {
        await supabase.from("settings").update({ selected_blog_id: blogs[0].id }).eq("user_id", userId);
      }
    }

    return NextResponse.redirect(new URL("/dashboard/blogs?success=connected", request.url));
  } catch (err) {
    console.error("Blogger OAuth callback error:", err);
    return NextResponse.redirect(new URL("/dashboard/blogs?error=oauth_failed", request.url));
  }
}
