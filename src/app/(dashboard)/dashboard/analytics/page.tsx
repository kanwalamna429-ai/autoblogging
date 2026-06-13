import { createClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [postsResult, logsResult, feedsResult] = await Promise.all([
    supabase
      .from("posts")
      .select("status, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("logs")
      .select("action, status, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("feeds")
      .select("id, name")
      .eq("user_id", user!.id),
  ]);

  return (
    <AnalyticsClient
      posts={postsResult.data || []}
      logs={logsResult.data || []}
      feeds={feedsResult.data || []}
    />
  );
}
