import type { SocialShareResult } from "@/types/api";

export async function shareToTumblr(
  accessToken: string,
  blogIdentifier: string,
  title: string,
  excerpt: string,
  articleUrl: string
): Promise<SocialShareResult> {
  try {
    const response = await fetch(
      `https://api.tumblr.com/v2/blog/${blogIdentifier}/post`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "link",
          title,
          url: articleUrl,
          description: excerpt.slice(0, 500),
          native_inline_images: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tumblr API error: ${error}`);
    }

    return { platform: "tumblr", success: true };
  } catch (error) {
    return {
      platform: "tumblr",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
