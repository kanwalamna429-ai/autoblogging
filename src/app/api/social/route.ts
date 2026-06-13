import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as Record<string, string>;
  const { platform, account_name, instance_url, access_token, identifier, app_password, blog_identifier } = body;

  if (!platform || !account_name) {
    return NextResponse.json({ error: "Platform and account name are required" }, { status: 400 });
  }

  let storedToken = access_token || "";
  let storedInstanceUrl = instance_url || null;

  if (platform === "bluesky") {
    if (!identifier || !app_password) {
      return NextResponse.json({ error: "Identifier and app password are required for Bluesky" }, { status: 400 });
    }
    storedToken = `${identifier}|:|${app_password}`;
  } else if (platform === "tumblr") {
    if (!blog_identifier || !access_token) {
      return NextResponse.json({ error: "Blog identifier and access token are required for Tumblr" }, { status: 400 });
    }
    storedToken = `${blog_identifier}|:|${access_token}`;
  } else if (platform === "mastodon" || platform === "pixelfed") {
    if (!instance_url || !access_token) {
      return NextResponse.json({ error: "Instance URL and access token are required" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("social_accounts")
    .insert({
      user_id: user.id,
      platform: platform as "bluesky" | "mastodon" | "tumblr" | "pixelfed",
      account_name,
      access_token: storedToken,
      instance_url: storedInstanceUrl,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}
