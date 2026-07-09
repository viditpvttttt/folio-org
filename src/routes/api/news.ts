import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";

const TOPIC_MAP: Record<string, string> = {
  top: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  tech: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
  world: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
  business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
  science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
  sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
  entertainment: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

type NewsItem = { title: string; link: string; source: string; pubDate: string };

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = (url.searchParams.get("category") ?? "top").toLowerCase();
        const feed = TOPIC_MAP[category] ?? TOPIC_MAP.top;
        try {
          const r = await fetch(feed, {
            headers: { "User-Agent": "Mozilla/5.0 FolioBot/1.0" },
          });
          if (!r.ok) throw new Error(`Feed ${r.status}`);
          const xml = await r.text();
          const parsed = parser.parse(xml);
          const items = (parsed?.rss?.channel?.item ?? []) as Array<{
            title: string;
            link: string;
            pubDate: string;
            source?: string | { "#text": string };
          }>;
          const out: NewsItem[] = items.slice(0, 12).map((i) => ({
            title: typeof i.title === "string" ? i.title.replace(/\s+-\s+[^-]+$/, "") : String(i.title ?? ""),
            link: String(i.link ?? ""),
            source: typeof i.source === "string" ? i.source : (i.source?.["#text"] ?? ""),
            pubDate: String(i.pubDate ?? ""),
          }));
          return Response.json(
            { category, items: out, fetchedAt: new Date().toISOString() },
            {
              headers: {
                "cache-control": "public, max-age=120, s-maxage=120",
              },
            },
          );
        } catch (e) {
          return Response.json({ error: (e as Error).message, items: [] }, { status: 500 });
        }
      },
    },
  },
});
