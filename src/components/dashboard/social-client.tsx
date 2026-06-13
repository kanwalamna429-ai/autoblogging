"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Share2, Loader2, CheckCircle, XCircle } from "lucide-react";
import type { SocialAccount } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";

type Platform = "bluesky" | "mastodon" | "tumblr" | "pixelfed";

interface PlatformConfig {
  label: string;
  color: string;
  bgColor: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  description: string;
}

const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  bluesky: {
    label: "Bluesky",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "Share posts to Bluesky social network",
    fields: [
      { key: "identifier", label: "Handle / Email", placeholder: "you@bsky.social" },
      { key: "app_password", label: "App Password", placeholder: "xxxx-xxxx-xxxx-xxxx", type: "password" },
    ],
  },
  mastodon: {
    label: "Mastodon",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    description: "Share posts to your Mastodon instance",
    fields: [
      { key: "instance_url", label: "Instance URL", placeholder: "https://mastodon.social" },
      { key: "access_token", label: "Access Token", placeholder: "Your Mastodon access token", type: "password" },
    ],
  },
  tumblr: {
    label: "Tumblr",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    description: "Share posts to your Tumblr blog",
    fields: [
      { key: "blog_identifier", label: "Blog Identifier", placeholder: "yourblog.tumblr.com" },
      { key: "access_token", label: "OAuth Access Token", placeholder: "Your Tumblr OAuth token", type: "password" },
    ],
  },
  pixelfed: {
    label: "Pixelfed",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    description: "Share image posts to Pixelfed",
    fields: [
      { key: "instance_url", label: "Instance URL", placeholder: "https://pixelfed.social" },
      { key: "access_token", label: "Access Token", placeholder: "Your Pixelfed access token", type: "password" },
    ],
  },
};

interface SocialClientProps {
  initialAccounts: SocialAccount[];
}

export function SocialClient({ initialAccounts }: SocialClientProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [addPlatform, setAddPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);

  const platforms: Platform[] = ["bluesky", "mastodon", "tumblr", "pixelfed"];

  async function handleConnect() {
    if (!addPlatform || !accountName) {
      toast.error("Please fill in all fields");
      return;
    }

    const config = PLATFORM_CONFIG[addPlatform];
    for (const field of config.fields) {
      if (!formData[field.key]) {
        toast.error(`Please fill in ${field.label}`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        platform: addPlatform,
        account_name: accountName,
        ...formData,
      };

      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { data?: SocialAccount; error?: string };

      if (!res.ok) {
        toast.error(data.error || "Failed to connect account");
        return;
      }

      setAccounts((prev) => [data.data!, ...prev]);
      setAddPlatform(null);
      setFormData({});
      setAccountName("");
      toast.success(`${PLATFORM_CONFIG[addPlatform].label} account connected!`);
    } catch {
      toast.error("Failed to connect account");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(account: SocialAccount) {
    try {
      const res = await fetch(`/api/social/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !account.active }),
      });
      const data = await res.json() as { data?: SocialAccount };
      if (res.ok && data.data) {
        setAccounts((prev) => prev.map((a) => (a.id === account.id ? data.data! : a)));
      }
    } catch {
      toast.error("Failed to update account");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/social/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        toast.success("Account removed");
      }
    } catch {
      toast.error("Failed to remove account");
    }
  }

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Accounts</h1>
        <p className="text-muted-foreground mt-1">Connect social platforms for auto-sharing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const isConnected = connectedPlatforms.has(platform);
          return (
            <Card
              key={platform}
              className={`cursor-pointer transition-all hover:border-primary/50 ${isConnected ? "border-green-500/30" : ""}`}
              onClick={() => {
                setAddPlatform(platform);
                setFormData({});
                setAccountName("");
              }}
            >
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center mb-3`}>
                  <Share2 className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{config.label}</h3>
                  {isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {accounts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
          <div className="grid gap-4">
            {accounts.map((account) => {
              const config = PLATFORM_CONFIG[account.platform];
              return (
                <Card key={account.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Share2 className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{config.label}</span>
                          <Badge variant={account.active ? "success" : "secondary"}>
                            {account.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{account.account_name}</p>
                        {account.last_shared_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last shared: {formatDate(account.last_shared_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={account.active}
                            onCheckedChange={() => handleToggleActive(account)}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(account.id)}
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
        </div>
      )}

      <Dialog open={!!addPlatform} onOpenChange={(open) => !open && setAddPlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {addPlatform ? PLATFORM_CONFIG[addPlatform].label : ""}
            </DialogTitle>
          </DialogHeader>
          {addPlatform && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name (display label)</Label>
                <Input
                  placeholder="e.g. My Main Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
              {PLATFORM_CONFIG[addPlatform].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlatform(null)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
