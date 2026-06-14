"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Eye, EyeOff, Key, Bot, Globe, Share2, RefreshCw, Clock } from "lucide-react";
import type { Settings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SettingsClientProps {
  initialSettings: Settings | null;
  userEmail: string;
}

const DEFAULT_PROMPT = `Rewrite the following article completely while preserving all facts. Make it:
- Human-readable and engaging
- SEO optimized with natural keyword usage
- Completely unique wording
- Include proper H2 and H3 headings
- Add a FAQ section with 3-5 questions and answers
- Include a conclusion section
- Keep the original meaning intact
Output valid HTML only.`;

const INTERVAL_OPTIONS = [
  { value: "1", label: "Every hour" },
  { value: "2", label: "Every 2 hours" },
  { value: "3", label: "Every 3 hours" },
  { value: "6", label: "Every 6 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Once a day" },
];

export function SettingsClient({ initialSettings, userEmail }: SettingsClientProps) {
  const [geminiKey, setGeminiKey] = useState(initialSettings?.gemini_api_key || "");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(initialSettings?.ai_prompt || DEFAULT_PROMPT);
  const [autoPublish, setAutoPublish] = useState(initialSettings?.auto_publish ?? true);
  const [autoShare, setAutoShare] = useState(initialSettings?.auto_share ?? true);
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(initialSettings?.auto_fetch_enabled ?? false);
  const [fetchIntervalHours, setFetchIntervalHours] = useState(
    String(initialSettings?.fetch_interval_hours ?? 6)
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: geminiKey,
          ai_prompt: aiPrompt,
          auto_publish: autoPublish,
          auto_share: autoShare,
          auto_fetch_enabled: autoFetchEnabled,
          fetch_interval_hours: parseInt(fetchIntervalHours, 10),
        }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  function handleResetPrompt() {
    setAiPrompt(DEFAULT_PROMPT);
    toast.info("Prompt reset to default");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your autoblogging platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <CardDescription>Configure your AI and integration API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGeminiKey ? "text" : "password"}
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Auto-Fetch
            {autoFetchEnabled && (
              <Badge variant="success" className="ml-1">Active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Automatically fetch RSS feeds and publish new posts on a schedule — no manual clicks needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Auto-Fetch</p>
              <p className="text-xs text-muted-foreground">
                Fetch all active feeds automatically on a schedule
              </p>
            </div>
            <Switch checked={autoFetchEnabled} onCheckedChange={setAutoFetchEnabled} />
          </div>

          {autoFetchEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fetch Interval
                </Label>
                <Select value={fetchIntervalHours} onValueChange={setFetchIntervalHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often to check each active feed for new content
                </p>
              </div>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs font-medium">Setup required for automatic scheduling</p>
                <p className="text-xs text-muted-foreground">
                  1. Add <code className="bg-background px-1 rounded">CRON_SECRET</code> and{" "}
                  <code className="bg-background px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> in Replit Secrets
                </p>
                <p className="text-xs text-muted-foreground">
                  2. Deploy to Vercel — it will run the cron automatically every hour using <code className="bg-background px-1 rounded">vercel.json</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  3. Or call <code className="bg-background px-1 rounded">/api/cron/fetch-feeds</code> with{" "}
                  <code className="bg-background px-1 rounded">Authorization: Bearer YOUR_CRON_SECRET</code> from any external scheduler
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Rewrite Prompt
          </CardTitle>
          <CardDescription>Customize how Gemini rewrites your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-prompt">Rewrite Instructions</Label>
              <Button variant="ghost" size="sm" onClick={handleResetPrompt} className="text-xs h-7">
                Reset to Default
              </Button>
            </div>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={8}
              placeholder="Enter your custom AI prompt..."
            />
            <p className="text-xs text-muted-foreground">
              The AI will append the original article title and content to this prompt.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Publishing Options
          </CardTitle>
          <CardDescription>Control automatic publishing behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Auto Publish to Blogger</p>
              <p className="text-xs text-muted-foreground">
                Automatically publish rewritten posts to your default Blogger blog
              </p>
            </div>
            <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Auto Share to Social
              </p>
              <p className="text-xs text-muted-foreground">
                Automatically share published posts to connected social accounts
              </p>
            </div>
            <Switch checked={autoShare} onCheckedChange={setAutoShare} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} size="lg">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save All Settings
      </Button>
    </div>
  );
}
