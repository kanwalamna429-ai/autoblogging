import type { SocialShareResult } from "@/types/api";

export async function shareToPixelfed(
  instanceUrl: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  articleUrl: string
): Promise<SocialShareResult> {
  try {
    const instance = instanceUrl.replace(/\/$/, "");

    let mediaId: string | null = null;

    if (imageUrl) {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob();
        const formData = new FormData();
        formData.append("file", imageBlob, "image.jpg");
        formData.append("description", caption.slice(0, 420));

        const mediaResponse = await fetch(`${instance}/api/v1/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json() as { id: string };
          mediaId = mediaData.id;
        }
      }
    }

    const statusText = `${caption.slice(0, 300)}\n\n${articleUrl}`;

    const body: Record<string, unknown> = {
      status: statusText,
      visibility: "public",
    };

    if (mediaId) {
      body.media_ids = [mediaId];
    }

    const response = await fetch(`${instance}/api/v1/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pixelfed API error: ${error}`);
    }

    return { platform: "pixelfed", success: true };
  } catch (error) {
    return {
      platform: "pixelfed",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
