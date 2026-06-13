import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
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

  const body = await request.json() as {
    gemini_api_key?: string;
    ai_prompt?: string;
    auto_publish?: boolean;
    auto_share?: boolean;
  };

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from("settings")
      .update(body)
      .eq("user_id", user.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("settings")
      .insert({ user_id: user.id, ...body })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ data: result.data, success: true });
}
