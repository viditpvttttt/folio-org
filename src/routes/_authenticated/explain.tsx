import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Sparkles, LogOut, Wand2, Loader2, RefreshCw } from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageResponse } from "@/components/ai-elements/message";

export const Route = createFileRoute("/_authenticated/explain")({
  component: ExplainPage,
  head: () => ({
    meta: [
      { title: "Explain · Folio" },
      { name: "description", content: "Type any topic and Folio explains it with a diagram, analogy and clear steps." },
    ],
  }),
});

const SUGGESTIONS = [
  "How does OAuth 2.0 work?",
  "What is a Merkle tree?",
  "The Krebs cycle",
  "React's render phase vs commit phase",
  "How does a transformer model attend?",
  "The lifecycle of an HTTP request",
];

function ExplainPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (t?: string) => {
    const q = (t ?? topic).trim();
    if (q.length < 2) return;
    if (t) setTopic(t);
    setOutput("");
    setStreaming(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Explain failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#7dd3fc_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,#c4b5fd_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,#fca5a5_0%,transparent_65%)] opacity-25 blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] -z-10" />

      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Chat</Link>
          <Link to="/explain" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium">Explain</Link>
          <Link to="/workbench" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Workbench</Link>
          <Link to="/connectors" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Connectors</Link>
          <Link to="/settings" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => navigate({ to: "/chat" })} className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-foreground/5">Open chat</button>
          {user && (
            <button onClick={signOut} title="Sign out" className="text-foreground/60 hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Understand anything</p>
          <h1 className="font-serif text-5xl md:text-6xl mt-3">Explain.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Type a topic, a system, or a "how does X work?" — Folio replies with a diagram, an analogy, and clear steps.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 shadow-lg">
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
            }}
            placeholder="e.g. How does the Kubernetes scheduler pick a node?"
            className="min-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 text-base"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              Tip: press <kbd className="px-1 py-0.5 rounded bg-foreground/10 text-[10px]">⌘/Ctrl + Enter</kbd> to explain
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {output && !streaming && (
                <Button size="sm" variant="ghost" onClick={() => run()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
              )}
              <Button size="sm" onClick={() => run()} disabled={streaming || topic.trim().length < 2}>
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {streaming ? "Thinking…" : "Explain"}
              </Button>
            </div>
          </div>
        </div>

        {!output && !streaming && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Try one</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
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

        {(output || streaming) && (
          <article className="mt-8 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-lg prose prose-neutral dark:prose-invert max-w-none">
            {output ? (
              <MessageResponse isAnimating={streaming}>{output}</MessageResponse>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Composing a visual explanation…
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
