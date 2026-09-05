import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Newspaper, RefreshCw, ExternalLink, Plus, X, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";

type NewsItem = { title: string; link: string; source: string; pubDate: string };
type Res = { category: string; items: NewsItem[]; fetchedAt: string; degraded?: boolean; error?: string };

const PRESETS = [
  "top", "tech", "world", "business", "science", "health",
  "sports", "entertainment", "ai", "startups", "crypto", "space", "climate", "india",
] as const;

const DEFAULT_TOPICS = ["top", "tech", "world", "business", "ai"];
const STORE_KEY = "folio.news.topics";
const REFRESH_MS = 2 * 60 * 1000;

function label(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
  const prefs = usePreferences();
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [category, setCategory] = useState<string>(DEFAULT_TOPICS[0]);
  const [data, setData] = useState<Res | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [tick, setTick] = useState(0);

  // Load saved topics, then pin the preferred default topic first.
  useEffect(() => {
    let list = DEFAULT_TOPICS;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length) list = saved as string[];
    } catch {
      /* ignore */
    }
    const preferred = (prefs.newsTopic || "").trim().toLowerCase();
    if (preferred) list = [preferred, ...list.filter((t) => t !== preferred)];
    setTopics(list);
    setCategory(list[0]!);
  }, [prefs.newsTopic]);

  const persist = (next: string[]) => {
    setTopics(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const isPreset = (PRESETS as readonly string[]).includes(cat);
      const qs = isPreset ? `category=${encodeURIComponent(cat)}` : `q=${encodeURIComponent(cat)}`;
      const r = await fetch(`/api/news?${qs}&_=${Date.now()}`);
      setData((await r.json()) as Res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(category);
    const id = setInterval(() => {
      void load(category);
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [category, load]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const available = useMemo(() => PRESETS.filter((p) => !topics.includes(p)), [topics]);

  const addTopic = (t: string) => {
    const v = t.trim().toLowerCase();
    if (!v || topics.includes(v)) return;
    persist([...topics, v]);
    setDraft("");
    setCategory(v);
  };

  const removeTopic = (t: string) => {
    const next = topics.filter((x) => x !== t);
    persist(next.length ? next : DEFAULT_TOPICS);
    if (category === t) setCategory((next[0] ?? DEFAULT_TOPICS[0]));
  };

  return (
    <div className="mx-3 mb-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
        <Newspaper className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">Live news</span>
        <button
          onClick={() => setEditing((e) => !e)}
          className="ml-auto text-muted-foreground hover:text-foreground transition"
          aria-label={editing ? "Done editing topics" : "Customize topics"}
        >
          {editing ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </button>
        <button
          onClick={() => load(category)}
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="Refresh"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto px-2 py-2 border-b border-border/40 scrollbar-none">
        {topics.map((c) => (
          <span key={c} className="relative shrink-0">
            <button
              onClick={() => setCategory(c)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full transition",
                editing && "pr-5",
                category === c
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              )}
            >
              {label(c)}
            </button>
            {editing && (
              <button
                onClick={() => removeTopic(c)}
                aria-label={`Remove ${c}`}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>

      {editing && (
        <div className="px-3 py-2 border-b border-border/40 space-y-2">
          <div className="flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic(draft)}
              placeholder="Add any topic — e.g. formula 1, nvidia…"
              className="flex-1 min-w-0 bg-background/60 border border-border/60 rounded-md px-2 py-1 text-[11px] outline-none focus:border-foreground/40"
            />
            <button
              onClick={() => addTopic(draft)}
              className="text-[11px] px-2 py-1 rounded-md bg-foreground text-background shrink-0"
            >
              Add
            </button>
          </div>
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {available.map((p) => (
                <button
                  key={p}
                  onClick={() => addTopic(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
                >
                  + {label(p)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <ul className="max-h-72 overflow-y-auto divide-y divide-border/30">
        {!data && loading && (
          <li className="p-4 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Fetching headlines…
          </li>
        )}
        {data && data.items.length === 0 && (
          <li className="p-4 text-xs text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" /> Couldn&apos;t reach the feed.
            <button onClick={() => load(category)} className="underline hover:text-foreground">
              Retry
            </button>
          </li>
        )}
        {data?.items.map((it, i) => (
          <li key={`${it.link}-${i}`}>
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
          {data.degraded ? "Showing closest available feed · " : ""}
          Auto-refreshes every 2 min · updated {timeAgo(data.fetchedAt)}
        </div>
      )}
    </div>
  );
}
