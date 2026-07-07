import { tool } from "ai";
import { z } from "zod";

/**
 * deepResearch — search the live web and get scraped text from top results.
 * Uses Jina's free reader/search endpoints — no connector or API key needed.
 * `s.jina.ai` returns markdown-formatted search results with snippets.
 * For deeper crawl, we then fetch the top N URLs via `r.jina.ai` for full text.
 */
export const deepResearchTool = tool({
  description:
    "Search the live web and read the top results in full. Use for up-to-date info: latest docs, breaking news, current prices, recent releases, or anything that might have changed recently. Returns titles, URLs, and cleaned-text excerpts. Cite the URLs in your reply.",
  inputSchema: z.object({
    query: z.string().min(2).describe("The search query — be specific."),
    depth: z.enum(["shallow", "deep"]).default("shallow").describe("shallow = search only, deep = search + fetch top 3 pages"),
  }),
  execute: async ({ query, depth }) => {
    try {
      const searchRes = await fetch(`https://s.jina.ai/?q=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json", "X-Retain-Images": "none" },
      });
      if (!searchRes.ok) return { error: `Search failed (${searchRes.status})` };
      const data = await searchRes.json();
      type Item = { title?: string; url?: string; description?: string; content?: string };
      const raw: Item[] = Array.isArray(data?.data) ? data.data : [];
      const results = raw.slice(0, 5).map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        snippet: (r.description ?? r.content ?? "").slice(0, 400),
      }));

      if (depth === "deep") {
        const top = results.slice(0, 3);
        const enriched = await Promise.all(
          top.map(async (r) => {
            if (!r.url) return { ...r, fullText: "" };
            try {
              const res = await fetch(`https://r.jina.ai/${r.url}`, {
                headers: { "X-Return-Format": "markdown" },
              });
              if (!res.ok) return { ...r, fullText: "" };
              const text = await res.text();
              return { ...r, fullText: text.slice(0, 4000) };
            } catch {
              return { ...r, fullText: "" };
            }
          }),
        );
        return { query, depth, results: [...enriched, ...results.slice(3)] };
      }

      return { query, depth, results };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});
