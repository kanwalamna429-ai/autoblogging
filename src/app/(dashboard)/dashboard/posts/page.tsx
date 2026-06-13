import { createClient } from "@/lib/supabase/server";
import { PostsClient } from "@/components/dashboard/posts-client";

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return <PostsClient initialPosts={posts || []} />;
}
