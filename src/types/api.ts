export interface RSSItem {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
}

export interface RewrittenContent {
  title: string;
  content: string;
  metaDescription: string;
  tags: string[];
}

export interface BloggerPost {
  id: string;
  url: string;
  title: string;
  published: string;
}

export interface SocialShareResult {
  platform: string;
  success: boolean;
  error?: string;
}

export interface ProcessFeedResult {
  processed: number;
  published: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
