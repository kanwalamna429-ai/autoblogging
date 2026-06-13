import { createClient } from "@/lib/supabase/server";
import { FeedsClient } from "@/components/dashboard/feeds-client";

export default async function FeedsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: feeds } = await supabase
    .from("feeds")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <FeedsClient initialFeeds={feeds || []} />;
}
