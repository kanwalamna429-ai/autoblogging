"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, FileText, Share2, TrendingUp, CheckCircle } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface Post {
  status: string;
  created_at: string;
}

interface Log {
  action: string;
  status: string;
  created_at: string;
}

interface Feed {
  id: string;
  name: string;
}

interface AnalyticsClientProps {
  posts: Post[];
  logs: Log[];
  feeds: Feed[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsClient({ posts, logs }: AnalyticsClientProps) {
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const postsPerDay = useMemo(() => {
    return last30Days.map((day) => {
      const dayStr = format(startOfDay(day), "yyyy-MM-dd");
      const count = posts.filter(
        (p) => format(startOfDay(new Date(p.created_at)), "yyyy-MM-dd") === dayStr
      ).length;
      const published = posts.filter(
        (p) =>
          format(startOfDay(new Date(p.created_at)), "yyyy-MM-dd") === dayStr &&
          p.status === "published"
      ).length;
      return { date: format(day, "MMM d"), total: count, published };
    });
  }, [posts, last30Days]);

  const sharesPerPlatform = useMemo(() => {
    const platforms = ["bluesky", "mastodon", "tumblr", "pixelfed"];
    return platforms.map((platform) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      value: logs.filter(
        (l) =>
          l.action.toLowerCase().includes(platform) && l.status === "success"
      ).length,
    }));
  }, [logs]);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const failedPosts = posts.filter((p) => p.status === "failed").length;
  const successRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;
  const totalShares = sharesPerPlatform.reduce((sum, p) => sum + p.value, 0);

  const statusData = [
    { name: "Published", value: publishedPosts },
    { name: "Draft", value: posts.filter((p) => p.status === "draft").length },
    { name: "Failed", value: failedPosts },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your autoblogging performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: totalPosts, icon: FileText, color: "text-blue-400" },
          { label: "Published", value: publishedPosts, icon: CheckCircle, color: "text-green-400" },
          { label: "Total Shares", value: totalShares, icon: Share2, color: "text-purple-400" },
          { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "text-orange-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Posts Per Day (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={postsPerDay}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="publishedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={6}
                />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="url(#totalGradient)" name="Total" />
                <Area type="monotone" dataKey="published" stroke="#10b981" fill="url(#publishedGradient)" name="Published" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Shares Per Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sharesPerPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" name="Shares" radius={[4, 4, 0, 0]}>
                  {sharesPerPlatform.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Status Distribution</CardTitle>
            <CardDescription>Breakdown of all posts by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Summary</CardTitle>
            <CardDescription>Overall platform performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Total Posts Generated", value: totalPosts, color: "bg-blue-500" },
              { label: "Successfully Published", value: publishedPosts, color: "bg-green-500" },
              { label: "Publish Failed", value: failedPosts, color: "bg-red-500" },
              { label: "Total Social Shares", value: totalShares, color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{
                      width: totalPosts > 0
                        ? `${Math.min(100, (item.value / totalPosts) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
