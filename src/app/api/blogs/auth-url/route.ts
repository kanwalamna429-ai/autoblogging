import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBloggerAuthUrl } from "@/lib/blogger";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/blogs/callback`;
  const url = getBloggerAuthUrl(redirectUri, `${state}:${user.id}`);

  return NextResponse.json({ url, success: true });
}
