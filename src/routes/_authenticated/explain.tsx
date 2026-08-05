import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Sparkles, LogOut, Wand2, Loader2, RefreshCw } from "lucide-react";
import { AppShell, PageHeading } from "@/components/shell/AppShell";
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
    <AppShell>

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
    </AppShell>
  );
}
