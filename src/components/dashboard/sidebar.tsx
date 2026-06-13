"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Rss,
  LayoutDashboard,
  FileText,
  Globe,
  Share2,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/feeds", label: "RSS Feeds", icon: Rss },
  { href: "/dashboard/posts", label: "Posts", icon: FileText },
  { href: "/dashboard/blogs", label: "Blogger Blogs", icon: Globe },
  { href: "/dashboard/social", label: "Social Accounts", icon: Share2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: User;
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Rss className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground text-lg">AutoBlog</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar-background border border-sidebar-border text-sidebar-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-sidebar-background border-r border-sidebar-border z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-64 flex-col bg-sidebar-background border-r border-sidebar-border shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>
    </>
  );
}
