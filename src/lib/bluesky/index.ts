import { AtpAgent } from "@atproto/api";
import type { SocialShareResult } from "@/types/api";

export async function shareToBluesky(
  identifier: string,
  appPassword: string,
  title: string,
  excerpt: string,
  articleUrl: string
): Promise<SocialShareResult> {
  try {
    const agent = new AtpAgent({ service: "https://bsky.social" });

    await agent.login({ identifier, password: appPassword });

    const text = `${title}\n\n${excerpt.slice(0, 200)}...\n\n${articleUrl}`.slice(0, 300);

    const facets = [];
    const urlStart = Buffer.byteLength(text.replace(articleUrl, ""), "utf8");
    const urlEnd = Buffer.byteLength(text, "utf8");

    if (articleUrl && text.includes(articleUrl)) {
      facets.push({
        index: { byteStart: urlStart, byteEnd: urlEnd },
        features: [{ $type: "app.bsky.richtext.facet#link", uri: articleUrl }],
      });
    }

    await agent.post({
      text,
      facets: facets.length > 0 ? facets : undefined,
      createdAt: new Date().toISOString(),
    });

    return { platform: "bluesky", success: true };
  } catch (error) {
    return {
      platform: "bluesky",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
