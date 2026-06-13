import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

  const body = await request.json() as { name: string; feed_url: string; category: string };

  if (!body.name || !body.feed_url || !body.category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    new URL(body.feed_url);
  } catch {
    return NextResponse.json({ error: "Invalid feed URL" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feeds")
    .insert({
      user_id: user.id,
      name: body.name,
      feed_url: body.feed_url,
      category: body.category,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}
