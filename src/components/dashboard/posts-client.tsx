"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FileText, Search, ExternalLink, Send, RefreshCw, Loader2, Edit, Trash2,
} from "lucide-react";
import type { Post } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, extractExcerpt } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface PostsClientProps {
  initialPosts: Post[];
}

type StatusFilter = "all" | "draft" | "published" | "failed";

export function PostsClient({ initialPosts }: PostsClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [publishingPost, setPublishingPost] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.rewritten_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.source_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handlePublish(postId: string) {
    setPublishingPost(postId);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json() as { data?: Post; error?: string };

      if (!res.ok) {
        toast.error(data.error || "Failed to publish post");
        return;
      }

      setPosts((prev) => prev.map((p) => (p.id === postId ? data.data! : p)));
      toast.success("Post published to Blogger!");
    } catch {
      toast.error("Failed to publish post");
    } finally {
      setPublishingPost(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete post");
        return;
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  }

  async function handleSaveEdit() {
    if (!editPost) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewritten_title: editForm.title,
          rewritten_content: editForm.content,
        }),
      });
      const data = await res.json() as { data?: Post; error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to update post");
        return;
      }
      setPosts((prev) => prev.map((p) => (p.id === editPost.id ? data.data! : p)));
      setEditPost(null);
      toast.success("Post updated");
    } catch {
      toast.error("Failed to update post");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(post: Post) {
    setEditPost(post);
    setEditForm({
      title: post.rewritten_title || post.source_title,
      content: post.rewritten_content || "",
    });
  }

  function getStatusBadgeVariant(status: Post["status"]) {
    if (status === "published") return "success" as const;
    if (status === "failed") return "error" as const;
    return "secondary" as const;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-muted-foreground mt-1">All generated and published content</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <FileText className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No posts found</p>
              <p className="text-sm text-muted-foreground">
                {posts.length === 0
                  ? "Fetch an RSS feed to generate posts"
                  : "Try adjusting your filters"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={getStatusBadgeVariant(post.status)}>{post.status}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {post.rewritten_title || post.source_title}
                    </h3>
                    {post.rewritten_content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {extractExcerpt(post.rewritten_content, 150)}
                      </p>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {post.blogger_url && (
                      <a
                        href={post.blogger_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        View on Blogger <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {post.status !== "published" && post.rewritten_content && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(post.id)}
                        disabled={publishingPost === post.id}
                      >
                        {publishingPost === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {publishingPost === post.id ? "Publishing..." : "Publish"}
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(post.id)}
                        disabled={publishingPost === post.id}
                      >
                        {publishingPost === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Republish
                      </Button>
                    )}
                    <Button size="icon" variant="outline" onClick={() => openEdit(post)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Content (HTML)</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                rows={15}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
