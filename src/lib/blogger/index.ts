import type { BloggerPost } from "@/types/api";

const BLOGGER_API_BASE = "https://www.googleapis.com/blogger/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export function getBloggerAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/blogger",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

export async function listUserBlogs(
  accessToken: string
): Promise<{ id: string; name: string; url: string }[]> {
  const response = await fetch(`${BLOGGER_API_BASE}/users/self/blogs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch blogs");
  }

  const data = await response.json() as {
    items?: { id: string; name: string; url: string }[];
  };
  return data.items || [];
}

export async function createBlogPost(
  accessToken: string,
  blogId: string,
  title: string,
  content: string,
  tags: string[]
): Promise<BloggerPost> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        labels: tags,
        status: "LIVE",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create post: ${error}`);
  }

  const data = await response.json() as {
    id: string;
    url: string;
    title: string;
    published: string;
  };

  return {
    id: data.id,
    url: data.url,
    title: data.title,
    published: data.published,
  };
}

export async function deleteBlogPost(
  accessToken: string,
  blogId: string,
  postId: string
): Promise<void> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts/${postId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete post");
  }
}

export async function updateBlogPost(
  accessToken: string,
  blogId: string,
  postId: string,
  title: string,
  content: string,
  tags: string[]
): Promise<BloggerPost> {
  const response = await fetch(
    `${BLOGGER_API_BASE}/blogs/${blogId}/posts/${postId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: postId,
        title,
        content,
        labels: tags,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update post: ${error}`);
  }

  const data = await response.json() as {
    id: string;
    url: string;
    title: string;
    published: string;
  };

  return {
    id: data.id,
    url: data.url,
    title: data.title,
    published: data.published,
  };
}
