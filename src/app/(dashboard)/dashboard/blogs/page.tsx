import { createClient } from "@/lib/supabase/server";
import { BlogsClient } from "@/components/dashboard/blogs-client";

export default async function BlogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [blogsResult, settingsResult] = await Promise.all([
    supabase.from("blogs").select("*").eq("user_id", user!.id).order("connected_at", { ascending: false }),
    supabase.from("settings").select("*").eq("user_id", user!.id).single(),
  ]);

  return (
    <BlogsClient
      initialBlogs={blogsResult.data || []}
      selectedBlogId={settingsResult.data?.selected_blog_id || null}
      hasBloggerAuth={!!settingsResult.data?.blogger_access_token}
    />
  );
}
