export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      blogs: {
        Row: {
          id: string;
          user_id: string;
          blog_id: string;
          blog_name: string;
          blog_url: string;
          connected_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          blog_id: string;
          blog_name: string;
          blog_url: string;
          connected_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          blog_id?: string;
          blog_name?: string;
          blog_url?: string;
          connected_at?: string;
        };
        Relationships: [];
      };
      feeds: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          feed_url: string;
          category: string;
          active: boolean;
          last_fetched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          feed_url: string;
          category: string;
          active?: boolean;
          last_fetched_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          feed_url?: string;
          category?: string;
          active?: boolean;
          last_fetched_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          feed_id: string | null;
          source_url: string;
          source_title: string;
          rewritten_title: string | null;
          rewritten_content: string | null;
          meta_description: string | null;
          tags: string[] | null;
          blogger_post_id: string | null;
          blogger_url: string | null;
          status: "draft" | "published" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feed_id?: string | null;
          source_url: string;
          source_title: string;
          rewritten_title?: string | null;
          rewritten_content?: string | null;
          meta_description?: string | null;
          tags?: string[] | null;
          blogger_post_id?: string | null;
          blogger_url?: string | null;
          status?: "draft" | "published" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          feed_id?: string | null;
          source_url?: string;
          source_title?: string;
          rewritten_title?: string | null;
          rewritten_content?: string | null;
          meta_description?: string | null;
          tags?: string[] | null;
          blogger_post_id?: string | null;
          blogger_url?: string | null;
          status?: "draft" | "published" | "failed";
          created_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: "bluesky" | "mastodon" | "tumblr" | "pixelfed";
          account_name: string;
          access_token: string;
          instance_url: string | null;
          active: boolean;
          last_shared_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: "bluesky" | "mastodon" | "tumblr" | "pixelfed";
          account_name: string;
          access_token: string;
          instance_url?: string | null;
          active?: boolean;
          last_shared_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: "bluesky" | "mastodon" | "tumblr" | "pixelfed";
          account_name?: string;
          access_token?: string;
          instance_url?: string | null;
          active?: boolean;
          last_shared_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          gemini_api_key: string | null;
          blogger_access_token: string | null;
          blogger_refresh_token: string | null;
          selected_blog_id: string | null;
          ai_prompt: string | null;
          auto_publish: boolean;
          auto_share: boolean;
          auto_fetch_enabled: boolean;
          fetch_interval_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gemini_api_key?: string | null;
          blogger_access_token?: string | null;
          blogger_refresh_token?: string | null;
          selected_blog_id?: string | null;
          ai_prompt?: string | null;
          auto_publish?: boolean;
          auto_share?: boolean;
          auto_fetch_enabled?: boolean;
          fetch_interval_hours?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gemini_api_key?: string | null;
          blogger_access_token?: string | null;
          blogger_refresh_token?: string | null;
          selected_blog_id?: string | null;
          ai_prompt?: string | null;
          auto_publish?: boolean;
          auto_share?: boolean;
          auto_fetch_enabled?: boolean;
          fetch_interval_hours?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          message: string;
          status: "success" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          message: string;
          status: "success" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          message?: string;
          status?: "success" | "failed";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Blog = Database["public"]["Tables"]["blogs"]["Row"];
export type Feed = Database["public"]["Tables"]["feeds"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type SocialAccount = Database["public"]["Tables"]["social_accounts"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Log = Database["public"]["Tables"]["logs"]["Row"];
