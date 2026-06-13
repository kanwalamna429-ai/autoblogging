import Link from "next/link";
import { ArrowRight, Rss, Bot, Globe, Share2, BarChart3, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Rss className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">AutoBlog</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Autoblogging Platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          RSS → AI Rewrite →{" "}
          <span className="text-primary">Blogger Publish</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Automatically import content from any RSS feed, rewrite it with Google
          Gemini AI, publish to Blogger, and distribute across all social
          platforms — instantly.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
          >
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-border rounded-lg px-6 py-3 font-medium hover:bg-accent transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Rss,
              title: "RSS Feed Import",
              description:
                "Connect any RSS feed and automatically pull fresh content from your favorite sources.",
            },
            {
              icon: Bot,
              title: "Gemini AI Rewrite",
              description:
                "Google Gemini rewrites each article to be unique, SEO-optimized, and human-readable.",
            },
            {
              icon: Globe,
              title: "Blogger Publishing",
              description:
                "Publish directly to your Blogger blog with full OAuth integration and post management.",
            },
            {
              icon: Share2,
              title: "Social Distribution",
              description:
                "Instantly share to Bluesky, Mastodon, Tumblr, and Pixelfed after each publication.",
            },
            {
              icon: BarChart3,
              title: "Analytics Dashboard",
              description:
                "Track posts, shares, success rates, and feed performance with visual charts.",
            },
            {
              icon: Zap,
              title: "Instant Processing",
              description:
                "No queues, no delays. Everything happens immediately — fetch, rewrite, publish, share.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="border border-border rounded-xl p-6 bg-card hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2025 AutoBlog. All rights reserved.</span>
          <span>Powered by Google Gemini AI</span>
        </div>
      </section>
    </div>
  );
}
