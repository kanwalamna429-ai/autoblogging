"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Globe, Link as LinkIcon, Trash2, Star, ExternalLink, Loader2, Plus } from "lucide-react";
import type { Blog } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

interface BlogsClientProps {
  initialBlogs: Blog[];
  selectedBlogId: string | null;
  hasBloggerAuth: boolean;
}

export function BlogsClient({ initialBlogs, selectedBlogId: initialSelectedId, hasBloggerAuth }: BlogsClientProps) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(initialSelectedId);
  const [loading, setLoading] = useState(false);
  const [connectingBlogger, setConnectingBlogger] = useState(false);
  const [syncingBlogs, setSyncingBlogs] = useState(false);

  async function handleConnectBlogger() {
    setConnectingBlogger(true);
    try {
      const res = await fetch("/api/blogs/auth-url");
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to get auth URL");
        setConnectingBlogger(false);
      }
    } catch {
      toast.error("Failed to connect to Blogger");
      setConnectingBlogger(false);
    }
  }

  async function handleSyncBlogs() {
    setSyncingBlogs(true);
    try {
      const res = await fetch("/api/blogs/sync", { method: "POST" });
      const data = await res.json() as { data?: Blog[]; error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to sync blogs");
        return;
      }
      setBlogs(data.data || []);
      toast.success("Blogs synced successfully");
    } catch {
      toast.error("Failed to sync blogs");
    } finally {
      setSyncingBlogs(false);
    }
  }

  async function handleSetDefault(blogId: string) {
    try {
      const res = await fetch("/api/blogs/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });
      if (res.ok) {
        setSelectedBlogId(blogId);
        toast.success("Default blog updated");
      }
    } catch {
      toast.error("Failed to set default blog");
    }
  }

  async function handleRemoveBlog(id: string) {
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
        if (selectedBlogId === blogs.find((b) => b.id === id)?.blog_id) {
          setSelectedBlogId(null);
        }
        toast.success("Blog removed");
      }
    } catch {
      toast.error("Failed to remove blog");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blogger Blogs</h1>
          <p className="text-muted-foreground mt-1">Connect and manage your Blogger blogs</p>
        </div>
        <div className="flex gap-2">
          {hasBloggerAuth && (
            <Button variant="outline" onClick={handleSyncBlogs} disabled={syncingBlogs}>
              {syncingBlogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Sync Blogs
            </Button>
          )}
          <Button onClick={handleConnectBlogger} disabled={connectingBlogger}>
            {connectingBlogger ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {hasBloggerAuth ? "Reconnect Blogger" : "Connect Blogger"}
          </Button>
        </div>
      </div>

      {!hasBloggerAuth && (
        <Alert>
          <Globe className="w-4 h-4" />
          <AlertDescription>
            Connect your Google/Blogger account to start publishing posts. Click{" "}
            <strong>Connect Blogger</strong> to authorize.
          </AlertDescription>
        </Alert>
      )}

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Globe className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No blogs connected</p>
              <p className="text-sm text-muted-foreground">
                {hasBloggerAuth
                  ? "Click Sync Blogs to import your Blogger blogs"
                  : "Connect your Blogger account to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => {
            const isDefault = selectedBlogId === blog.blog_id;
            return (
              <Card key={blog.id} className={isDefault ? "border-primary/50" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{blog.blog_name}</h3>
                        {isDefault && <Badge variant="default">Default</Badge>}
                      </div>
                      <a
                        href={blog.blog_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                      >
                        {blog.blog_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">
                        Connected {formatDate(blog.connected_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isDefault && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefault(blog.blog_id)}>
                          <Star className="w-4 h-4" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveBlog(blog.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
