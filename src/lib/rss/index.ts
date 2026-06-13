import { XMLParser } from "fast-xml-parser";
import type { RSSItem } from "@/types/api";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  trimValues: true,
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

function extractImageFromContent(content: string): string | undefined {
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function getTextContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    if ("#text" in value) return String((value as Record<string, unknown>)["#text"]);
    if ("__cdata" in value) return String((value as Record<string, unknown>)["__cdata"]);
  }
  return String(value ?? "");
}

export async function fetchAndParseRSS(feedUrl: string): Promise<RSSItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RSSBot/1.0)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as Record<string, unknown>;

  const channel =
    (parsed?.rss as Record<string, unknown>)?.channel ||
    (parsed?.feed as Record<string, unknown>);

  if (!channel) {
    throw new Error("Invalid RSS feed format");
  }

  const rawItems =
    (channel as Record<string, unknown>).item ||
    (channel as Record<string, unknown>).entry ||
    [];

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((item: unknown) => {
    const i = item as Record<string, unknown>;
    const title = getTextContent(i.title || "Untitled");
    const link = getTextContent(
      i.link || (i as Record<string, unknown>)["@_href"] || ""
    );
    const content = getTextContent(
      i["content:encoded"] ||
        i.content ||
        i.description ||
        i.summary ||
        ""
    );
    const author = getTextContent(
      i.author ||
        i["dc:creator"] ||
        (i.author as Record<string, unknown>)?.name ||
        ""
    );
    const pubDate = getTextContent(i.pubDate || i.published || i.updated || "");

    const enclosure = i.enclosure as Record<string, unknown> | undefined;
    const mediaContent = i["media:content"] as Record<string, unknown> | undefined;
    const mediaThumbnail = i["media:thumbnail"] as Record<string, unknown> | undefined;

    let imageUrl: string | undefined =
      (enclosure?.["@_url"] as string) ||
      (mediaContent?.["@_url"] as string) ||
      (mediaThumbnail?.["@_url"] as string) ||
      extractImageFromContent(content);

    return {
      title: stripHtml(title),
      content,
      url: link,
      imageUrl,
      author: stripHtml(author),
      publishedAt: pubDate,
    };
  });
}
