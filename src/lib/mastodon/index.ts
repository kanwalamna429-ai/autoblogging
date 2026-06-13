import type { SocialShareResult } from "@/types/api";

export async function shareToMastodon(
  instanceUrl: string,
  accessToken: string,
  title: string,
  excerpt: string,
  articleUrl: string
): Promise<SocialShareResult> {
  try {
    const instance = instanceUrl.replace(/\/$/, "");
    const status = `${title}\n\n${excerpt.slice(0, 200)}...\n\n${articleUrl}`.slice(0, 500);

    const response = await fetch(`${instance}/api/v1/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        visibility: "public",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mastodon API error: ${error}`);
    }

    return { platform: "mastodon", success: true };
  } catch (error) {
    return {
      platform: "mastodon",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
