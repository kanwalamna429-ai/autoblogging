import { createClient } from "@/lib/supabase/server";
import { SocialClient } from "@/components/dashboard/social-client";

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <SocialClient initialAccounts={accounts || []} />;
}
