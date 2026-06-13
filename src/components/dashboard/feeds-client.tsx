"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Rss, Trash2, Edit, Play, Pause, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import type { Feed } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const CATEGORIES = [
  "General", "Technology", "Crypto", "Finance", "Travel", "Pets",
  "Health", "Sports", "Politics", "Entertainment", "Science", "Business",
];

interface FeedsClientProps {
  initialFeeds: Feed[];
}

export function FeedsClient({ initialFeeds }: FeedsClientProps) {
  const [feeds, setFeeds] = useState<Feed[]>(initialFeeds);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editFeed, setEditFeed] = useState<Feed | null>(null);
  const [fetchingFeed, setFetchingFeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", feed_url: "", category: "General" });

  async function handleAddFeed() {
    if (!form.name || !form.feed_url) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      new URL(form.feed_url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { data?: Feed; error?: string };

      if (!res.ok) {
        toast.error(data.error || "Failed to add feed");
        return;
      }

      setFeeds((prev) => [data.data!, ...prev]);
      setShowAddDialog(false);
      setForm({ name: "", feed_url: "", category: "General" });
      toast.success("Feed added successfully");
    } catch {
      toast.error("Failed to add feed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateFeed() {
    if (!editFeed || !form.name || !form.feed_url) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/feeds/${editFeed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { data?: Feed; error?: string };

      if (!res.ok) {
        toast.error(data.error || "Failed to update feed");
        return;
      }

      setFeeds((prev) => prev.map((f) => (f.id === editFeed.id ? data.data! : f)));
      setEditFeed(null);
      toast.success("Feed updated");
    } catch {
      toast.error("Failed to update feed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFeed(id: string) {
    try {
      const res = await fetch(`/api/feeds/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete feed");
        return;
      }
      setFeeds((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feed deleted");
    } catch {
      toast.error("Failed to delete feed");
    }
  }

  async function handleToggleActive(feed: Feed) {
    try {
      const res = await fetch(`/api/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !feed.active }),
      });
      const data = await res.json() as { data?: Feed };
      if (res.ok && data.data) {
        setFeeds((prev) => prev.map((f) => (f.id === feed.id ? data.data! : f)));
        toast.success(data.data.active ? "Feed activated" : "Feed paused");
      }
    } catch {
      toast.error("Failed to update feed");
    }
  }

  async function handleFetchFeed(feedId: string) {
    setFetchingFeed(feedId);
    try {
      const res = await fetch("/api/feeds/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });
      const data = await res.json() as {
        processed?: number;
        published?: number;
        skipped?: number;
        failed?: number;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error || "Failed to process feed");
        return;
      }

      toast.success(
        `Processed: ${data.processed}, Published: ${data.published}, Skipped: ${data.skipped}, Failed: ${data.failed}`
      );
    } catch {
      toast.error("Failed to fetch feed");
    } finally {
      setFetchingFeed(null);
    }
  }

  function openEdit(feed: Feed) {
    setEditFeed(feed);
    setForm({ name: feed.name, feed_url: feed.feed_url, category: feed.category });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RSS Feeds</h1>
          <p className="text-muted-foreground mt-1">Manage your content sources</p>
        </div>
        <Button onClick={() => { setShowAddDialog(true); setForm({ name: "", feed_url: "", category: "General" }); }}>
          <Plus className="w-4 h-4" />
          Add Feed
        </Button>
      </div>

      {feeds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Rss className="w-12 h-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">No feeds yet</p>
              <p className="text-sm text-muted-foreground">Add an RSS feed to start importing content</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4" /> Add Your First Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feeds.map((feed) => (
            <Card key={feed.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Rss className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{feed.name}</h3>
                      <Badge variant={feed.active ? "success" : "secondary"}>
                        {feed.active ? "Active" : "Paused"}
                      </Badge>
                      <Badge variant="outline">{feed.category}</Badge>
                    </div>
                    <a
                      href={feed.feed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 truncate max-w-md"
                    >
                      {feed.feed_url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {formatDate(feed.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleFetchFeed(feed.id)}
                      disabled={fetchingFeed === feed.id}
                    >
                      {fetchingFeed === feed.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {fetchingFeed === feed.id ? "Processing..." : "Fetch"}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => handleToggleActive(feed)}>
                      {feed.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => openEdit(feed)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFeed(feed.id)}
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add RSS Feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed Name</Label>
              <Input
                placeholder="e.g. TechCrunch"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Feed URL</Label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={form.feed_url}
                onChange={(e) => setForm((f) => ({ ...f, feed_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFeed} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editFeed} onOpenChange={(open) => !open && setEditFeed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feed Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Feed URL</Label>
              <Input
                value={form.feed_url}
                onChange={(e) => setForm((f) => ({ ...f, feed_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFeed(null)}>Cancel</Button>
            <Button onClick={handleUpdateFeed} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
