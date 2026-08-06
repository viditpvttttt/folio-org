import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Sparkles, Wand2, Loader2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { FolioMark } from "@/components/brand/FolioMark";
import { Reveal } from "@/components/fx/Reveal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageResponse } from "@/components/ai-elements/message";

export const Route = createFileRoute("/_authenticated/explain")({
  component: ExplainPage,
  head: () => ({
    meta: [
      { title: "Explain · Folio" },
      { name: "description", content: "Type any topic and Folio explains it with a diagram, analogy and clear steps." },
      { property: "og:title", content: "Explain · Folio" },
      { property: "og:description", content: "Any topic, explained with a diagram, an analogy and clear steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <main className="relative z-10">
        {/* hero */}
        <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 md:pt-24">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Understand anything</p>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative mt-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-16 top-1/2 -z-10 h-[300px] w-[620px] max-w-[110vw] -translate-y-1/2 rounded-full rgb-blob opacity-40 blur-[90px]"
              />
              <h1 className="relative font-serif text-[clamp(2.75rem,8vw,6rem)] leading-[0.94] tracking-tight">
                Explain<br /><em className="italic">it to me.</em>
              </h1>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A topic, a system, a “how does X actually work?” — Folio answers with a diagram, an
              analogy, and steps you can follow.
            </p>
          </Reveal>
        </section>

        {/* composer */}
        <section className="mx-auto max-w-4xl px-6">
          <Reveal delay={200}>
            <div className="relative overflow-hidden rounded-2xl p-[1.5px]">
              <div aria-hidden className="absolute inset-0 rgb-blob opacity-60 blur-[10px]" />
              <div className="relative rounded-2xl border border-border/50 bg-background/85 p-4 backdrop-blur-xl">
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
                  }}
                  placeholder="e.g. How does the Kubernetes scheduler pick a node?"
                  className="min-h-24 resize-none border-0 bg-transparent text-base focus-visible:ring-0"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="hidden text-[11px] text-muted-foreground sm:block">
                    Press <kbd className="rounded bg-foreground/10 px-1 py-0.5 text-[10px]">⌘/Ctrl + Enter</kbd> to explain
                  </div>
                  <div className="ml-auto flex items-center gap-2">
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
            </div>
          </Reveal>
        </section>

        {/* suggestions */}
        {!output && !streaming && (
          <section className="mx-auto max-w-4xl px-6 pb-24 pt-12">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Try one</p>
            </Reveal>
            <Reveal delay={90}>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => run(s)}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground hover:text-background"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {s}
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-20 grid items-center gap-10 border-t border-border/60 pt-16 md:grid-cols-[1fr_auto]">
                <p className="font-serif text-3xl leading-[1.25] tracking-tight md:text-4xl">
                  Most answers give you <span className="text-muted-foreground">text</span>. Folio
                  gives you <em className="italic">a mental model</em>.
                </p>
                <div className="group mx-auto">
                  <FolioMark className="h-32 w-32 md:h-40 md:w-40" />
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* output */}
        {(output || streaming) && (
          <section className="mx-auto max-w-4xl px-6 pb-24 pt-10">
            <article className="prose prose-neutral dark:prose-invert max-w-none rounded-2xl border border-border/60 bg-card/60 p-6 shadow-lg backdrop-blur-xl md:p-10">
              {output ? (
                <MessageResponse isAnimating={streaming}>{output}</MessageResponse>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <FolioMark active className="h-8 w-8" /> Composing a visual explanation…
                </div>
              )}
            </article>
          </section>
        )}
      </main>
    </AppShell>
  );
}
