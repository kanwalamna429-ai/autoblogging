import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/dashboard/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  return <SettingsClient initialSettings={settings} userEmail={user!.email || ""} />;
}
