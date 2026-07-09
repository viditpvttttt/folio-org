import { useEffect, useMemo, useState } from "react";
import { Loader2, Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type NewsItem = { title: string; link: string; source: string; pubDate: string };
type Res = { category: string; items: NewsItem[]; fetchedAt: string };

const CATEGORIES = [
  { id: "top", label: "Top" },
  { id: "tech", label: "Tech" },
  { id: "world", label: "World" },
  { id: "business", label: "Business" },
  { id: "science", label: "Science" },
] as const;

const REFRESH_MS = 2 * 60 * 1000;

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NewsWidget() {
  const [category, setCategory] = useState<string>("top");
  const [data, setData] = useState<Res | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useMemo(
    () => async (cat: string) => {
      setLoading(true);
      try {
        const r = await fetch(`/api/news?category=${cat}&_=${Date.now()}`);
        const j = (await r.json()) as Res;
        setData(j);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(category);
    const id = setInterval(() => {
      void load(category);
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [category, load]);

  // Re-render "time ago" every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <Newspaper className="h-3.5 w-3.5 text-foreground/70" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live news</span>
        <button
          onClick={() => load(category)}
          className="ml-auto text-muted-foreground hover:text-foreground transition"
          aria-label="Refresh"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      </div>
      <div className="flex gap-1 overflow-x-auto px-2 py-2 border-b border-border/40 scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "shrink-0 text-[11px] px-2.5 py-1 rounded-full transition",
              category === c.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-border/30">
        {!data && loading && (
          <li className="p-4 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Fetching headlines…
          </li>
        )}
        {data?.items.length === 0 && (
          <li className="p-4 text-xs text-muted-foreground">No stories right now.</li>
        )}
        {data?.items.map((it, i) => (
          <li key={i}>
            <a
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-2 px-3 py-2.5 text-xs hover:bg-foreground/5 transition"
            >
              <span className="flex-1 leading-snug line-clamp-2">{it.title}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0 mt-0.5" />
            </a>
            <div className="px-3 pb-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              {it.source && <span className="truncate max-w-[60%]">{it.source}</span>}
              <span className="ml-auto tabular-nums" data-tick={tick}>
                {timeAgo(it.pubDate)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {data && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground text-center border-t border-border/40">
          Auto-refreshes every 2 min · updated {timeAgo(data.fetchedAt)}
        </div>
      )}
    </div>
  );
}
