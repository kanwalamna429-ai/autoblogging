import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listUserBlogs, refreshAccessToken } from "@/lib/blogger";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("blogger_access_token, blogger_refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!settings?.blogger_access_token) {
    return NextResponse.json({ error: "Blogger not connected" }, { status: 400 });
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

  try {
    const blogs = await listUserBlogs(accessToken);

    for (const blog of blogs) {
      const { data: existing } = await supabase
        .from("blogs")
        .select("id")
        .eq("user_id", user.id)
        .eq("blog_id", blog.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("blogs").insert({
          user_id: user.id,
          blog_id: blog.id,
          blog_name: blog.name,
          blog_url: blog.url,
        });
      } else {
        await supabase.from("blogs").update({
          blog_name: blog.name,
          blog_url: blog.url,
        }).eq("user_id", user.id).eq("blog_id", blog.id);
      }
    }

    const { data: allBlogs } = await supabase
      .from("blogs")
      .select("*")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false });

    return NextResponse.json({ data: allBlogs, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
