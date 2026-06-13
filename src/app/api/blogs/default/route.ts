import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { blogId: string };

  if (!body.blogId) {
    return NextResponse.json({ error: "blogId is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("settings").update({ selected_blog_id: body.blogId }).eq("user_id", user.id);
  } else {
    await supabase.from("settings").insert({ user_id: user.id, selected_blog_id: body.blogId });
  }

  return NextResponse.json({ success: true });
}
