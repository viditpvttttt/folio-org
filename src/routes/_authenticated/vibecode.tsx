import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { toast } from "sonner";
import {
  Loader2, LogOut, Sparkles, Wand2, RefreshCw, Copy, Code2, Download,
  Smartphone, Tablet, Monitor, History, Undo2, Bug, Send,
} from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/vibecode")({
  component: VibecodePage,
  head: () => ({
    meta: [
      { title: "Vibecode · Folio" },
      { name: "description", content: "Describe an app, watch it render live. Folio turns your prompt into a working React component you can refine, preview on any device, and download." },
      { property: "og:title", content: "Vibecode · Folio" },
      { property: "og:description", content: "Prompt to live React component — refine in plain English, preview on any device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const IDEAS = [
  "A pomodoro timer with a big glowing progress ring and a start/pause button",
  "An animated tic-tac-toe game with a shiny gradient board",
  "A dark-themed pricing table with 3 tiers and a highlighted plan",
  "A kanban board with drag-free column switching and colored labels",
  "A todo list with strikethrough animations and a confetti burst when all done",
  "A weather card that shows a sun with rotating rays",
];

const REFINEMENTS = [
  "Make it dark mode",
  "Add a subtle animation on hover",
  "Make it responsive for mobile",
  "Use a warmer color palette",
  "Add an empty state",
];

const DEVICES = [
  { id: "phone", label: "Phone", icon: Smartphone, width: 390 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { id: "desktop", label: "Desktop", icon: Monitor, width: 0 },
] as const;
type DeviceId = (typeof DEVICES)[number]["id"];

const BOILERPLATE = `function Hello() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="p-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white text-center shadow-2xl">
      <div className="text-sm uppercase tracking-widest opacity-80">Live preview</div>
      <div className="text-7xl font-bold tabular-nums mt-2">{count}</div>
      <button
        onClick={() => setCount(count + 1)}
        className="mt-6 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition"
      >
        Give it a whirl
      </button>
      <div className="mt-6 text-xs opacity-70">Describe something above and watch it appear here.</div>
    </div>
  );
}
render(<Hello />)`;

function extractCode(raw: string): string {
  const match = raw.match(/```(?:jsx|tsx|js|javascript|react)?\s*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  return raw.replace(/```[a-z]*\n?/gi, "").trim();
}

type Version = { id: number; label: string; code: string };

/** Captures react-live's error text so we can offer an auto-fix. */
function ErrorWatcher({ onError }: { onError: (msg: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => onError(el.textContent?.trim() || null);
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [onError]);
  return (
    <div ref={ref}>
      <LiveError className="mt-4 text-xs font-mono text-red-500 bg-red-500/5 rounded p-3 whitespace-pre-wrap" />
    </div>
  );
}

function VibecodePage() {
  const { user, signOut } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [raw, setRaw] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [versions, setVersions] = useState<Version[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const code = useMemo(() => (raw ? extractCode(raw) : BOILERPLATE), [raw]);
  const hasCode = Boolean(raw);

  const stream = async (
    body: { prompt: string; mode: "create" | "refine" | "fix"; previousCode?: string; error?: string },
    label: string,
  ) => {
    setRaw("");
    setLiveError(null);
    setStreaming(true);
    setTab("code");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/vibecode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Vibecode failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setRaw(acc);
      }
      setTab("preview");
      const final = extractCode(acc);
      if (final) setVersions((v) => [...v, { id: Date.now(), label, code: final }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setStreaming(false);
      setFixing(false);
    }
  };

  const run = (p?: string) => {
    const q = (p ?? prompt).trim();
    if (q.length < 2) return;
    if (p) setPrompt(p);
    void stream({ prompt: q, mode: "create" }, q.slice(0, 42));
  };

  const refine = (p?: string) => {
    const q = (p ?? refinePrompt).trim();
    if (q.length < 2 || !hasCode) return;
    setRefinePrompt("");
    void stream({ prompt: q, mode: "refine", previousCode: code }, `↻ ${q.slice(0, 38)}`);
  };

  const autoFix = () => {
    if (!liveError) return;
    setFixing(true);
    void stream({ prompt: "fix", mode: "fix", previousCode: code, error: liveError }, "🛠 auto-fix");
  };

  const restore = (v: Version) => {
    setRaw("```jsx\n" + v.code + "\n```");
    setTab("preview");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied code");
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "folio-component.jsx";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const frameWidth = DEVICES.find((d) => d.id === device)!.width;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#f472b6_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,#a78bfa_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,#22d3ee_0%,transparent_65%)] opacity-25 blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] -z-10" />

      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Chat</Link>
          <Link to="/explain" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Explain</Link>
          <Link to="/vibecode" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium">Vibecode</Link>
          <Link to="/work" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Work</Link>
          <Link to="/workbench" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Workbench</Link>
          <Link to="/settings" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <button onClick={signOut} title="Sign out" className="text-foreground/60 hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Prompt → live preview</p>
          <h1 className="font-serif text-5xl md:text-6xl mt-2">Vibecode.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Describe a widget, page, or micro-app. Folio writes a self-contained React component,
            renders it live, and edits itself when you ask for changes.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 shadow-lg">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
            }}
            placeholder="A neon-glow calculator with big buttons and a gradient screen…"
            className="min-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 text-base"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              <kbd className="px-1 py-0.5 rounded bg-foreground/10 text-[10px]">⌘/Ctrl + Enter</kbd> to generate
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {hasCode && !streaming && (
                <Button size="sm" variant="ghost" onClick={() => run()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              )}
              <Button size="sm" onClick={() => run()} disabled={streaming || prompt.trim().length < 2}>
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {streaming ? "Vibing…" : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        {!hasCode && !streaming && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Try one</p>
            <div className="flex flex-wrap gap-2">
              {IDEAS.map((s) => (
                <button
                  key={s}
                  onClick={() => run(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-background/40 hover:bg-foreground/10 transition-colors"
                >
                  <Sparkles className="inline h-3 w-3 mr-1" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* refine bar */}
        {hasCode && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-3">
            <div className="flex items-center gap-2">
              <input
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refine()}
                placeholder="Refine it — “make the header sticky”, “add a dark toggle”…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none px-2 py-1.5"
              />
              <Button size="sm" variant="secondary" onClick={() => refine()} disabled={streaming || refinePrompt.trim().length < 2}>
                <Send className="h-3.5 w-3.5" /> Refine
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {REFINEMENTS.map((r) => (
                <button
                  key={r}
                  onClick={() => refine(r)}
                  disabled={streaming}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition disabled:opacity-50"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5 text-xs">
              <button
                onClick={() => setTab("preview")}
                className={cn("px-3 py-1 rounded-full transition", tab === "preview" ? "bg-foreground text-background" : "text-muted-foreground")}
              >
                Preview
              </button>
              <button
                onClick={() => setTab("code")}
                className={cn("px-3 py-1 rounded-full transition", tab === "code" ? "bg-foreground text-background" : "text-muted-foreground")}
              >
                <Code2 className="inline h-3 w-3 mr-1" /> Code
              </button>
            </div>

            {tab === "preview" && (
              <div className="inline-flex rounded-full border border-border/60 bg-background/40 p-0.5 text-xs">
                {DEVICES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setDevice(id)}
                    aria-label={label}
                    title={label}
                    className={cn("px-2.5 py-1 rounded-full transition", device === id ? "bg-foreground text-background" : "text-muted-foreground")}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}

            {hasCode && (
              <div className="ml-auto flex items-center gap-3 text-xs">
                <button onClick={copyCode} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button onClick={download} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
                  <Download className="h-3 w-3" /> Download
                </button>
              </div>
            )}
          </div>

          {liveError && hasCode && !streaming && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs">
              <Bug className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="flex-1 min-w-0 truncate font-mono text-red-500">{liveError}</span>
              <Button size="sm" variant="secondary" onClick={autoFix} disabled={fixing}>
                {fixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Auto-fix
              </Button>
            </div>
          )}

          <LiveProvider code={code} noInline scope={{ React }}>
            {tab === "preview" ? (
              <div className="rounded-2xl border border-border/60 bg-white p-4 md:p-8 min-h-[360px] shadow-lg flex items-start justify-center overflow-auto">
                <div
                  className="w-full transition-all duration-300"
                  style={frameWidth ? { maxWidth: frameWidth } : undefined}
                >
                  <LivePreview />
                  <ErrorWatcher onError={setLiveError} />
                </div>
              </div>
            ) : (
              <pre className="rounded-2xl border border-border/60 bg-[#0b0b12] text-emerald-200 p-4 md:p-6 shadow-lg overflow-x-auto text-[12px] leading-relaxed max-h-[520px]">
                <code>{code}</code>
              </pre>
            )}
          </LiveProvider>

          {versions.length > 1 && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <History className="h-3 w-3" /> Versions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {versions.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => restore(v)}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition max-w-[240px]"
                  >
                    <Undo2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">v{i + 1} · {v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
