import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, FileText, Globe, Share2, CheckCircle, XCircle, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [feedsResult, postsResult, blogsResult, socialResult, logsResult] =
    await Promise.all([
      supabase.from("feeds").select("id, active").eq("user_id", user!.id),
      supabase.from("posts").select("id, status").eq("user_id", user!.id),
      supabase.from("blogs").select("id").eq("user_id", user!.id),
      supabase.from("social_accounts").select("id, active").eq("user_id", user!.id),
      supabase
        .from("logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const feeds = feedsResult.data || [];
  const posts = postsResult.data || [];
  const blogs = blogsResult.data || [];
  const socials = socialResult.data || [];
  const logs = logsResult.data || [];

  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const activeFeeds = feeds.filter((f) => f.active).length;
  const activeSocials = socials.filter((s) => s.active).length;

  const stats = [
    { label: "RSS Feeds", value: feeds.length, sub: `${activeFeeds} active`, icon: Rss, color: "text-blue-400" },
    { label: "Total Posts", value: posts.length, sub: `${publishedPosts} published`, icon: FileText, color: "text-green-400" },
    { label: "Blogger Blogs", value: blogs.length, sub: "connected", icon: Globe, color: "text-orange-400" },
    { label: "Social Accounts", value: socials.length, sub: `${activeSocials} active`, icon: Share2, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No activity yet. Start by adding an RSS feed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  {log.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.action}</span>
                      <Badge variant={log.status === "success" ? "success" : "error"}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
