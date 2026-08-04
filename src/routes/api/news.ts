import { createFileRoute } from "@tanstack/react-router";
import { XMLParser } from "fast-xml-parser";

const TOPIC_MAP: Record<string, string> = {
  top: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  tech: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
  world: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
  business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
  science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
  health: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en",
  sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
  entertainment:
    "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
};

// Search-feed shortcuts for topics Google doesn't expose as sections.
const SEARCH_ALIASES: Record<string, string> = {
  ai: "artificial intelligence OR LLM OR OpenAI",
  design: "product design OR UI design",
  startups: "startup funding OR YC OR seed round",
  crypto: "crypto OR bitcoin OR ethereum",
  space: "space OR NASA OR SpaceX",
  climate: "climate change OR renewable energy",
  india: "India",
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

type NewsItem = { title: string; link: string; source: string; pubDate: string };

function searchFeed(q: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

async function fetchText(url: string, ms = 6000): Promise<string> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
      signal: ac.signal,
    });
    if (!r.ok) throw new Error(`Feed responded ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

function parseItems(xml: string): NewsItem[] {
  const parsed = parser.parse(xml);
  const raw = parsed?.rss?.channel?.item ?? [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((i: Record<string, unknown>) => {
      const title = typeof i.title === "string" ? i.title : String(i.title ?? "");
      const src = i.source as string | { "#text"?: string } | undefined;
      return {
        title: title.replace(/\s+-\s+[^-]+$/, "").trim(),
        link: String(i.link ?? ""),
        source: typeof src === "string" ? src : (src?.["#text"] ?? ""),
        pubDate: new Date(String(i.pubDate ?? "")).toISOString?.() ?? String(i.pubDate ?? ""),
      };
    })
    .filter((i) => i.title && i.link);
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = (url.searchParams.get("category") ?? "top").toLowerCase();
        const q = url.searchParams.get("q")?.trim();
        const limit = Math.min(30, Math.max(3, Number(url.searchParams.get("limit") ?? 12)));

        // Ordered candidate feeds — first one that yields items wins.
        const candidates: string[] = [];
        if (q) candidates.push(searchFeed(q));
        else if (TOPIC_MAP[category]) candidates.push(TOPIC_MAP[category]);
        else if (SEARCH_ALIASES[category]) candidates.push(searchFeed(SEARCH_ALIASES[category]));
        else candidates.push(searchFeed(category));
        // Reliability fallbacks
        if (!q && category !== "top") candidates.push(searchFeed(SEARCH_ALIASES[category] ?? category));
        candidates.push(TOPIC_MAP.top);

        const errors: string[] = [];
        for (const feed of candidates) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const items = dedupe(parseItems(await fetchText(feed)));
              if (items.length) {
                return Response.json(
                  {
                    category: q ? `“${q}”` : category,
                    items: items.slice(0, limit),
                    fetchedAt: new Date().toISOString(),
                    degraded: feed !== candidates[0],
                  },
                  { headers: { "cache-control": "public, max-age=120, s-maxage=120" } },
                );
              }
              errors.push(`${feed}: empty`);
            } catch (e) {
              errors.push(`${feed}: ${(e as Error).message}`);
            }
          }
        }
        return Response.json(
          { category, items: [], error: errors.slice(-2).join(" | "), fetchedAt: new Date().toISOString() },
          { status: 200 },
        );
      },
    },
  },
});
