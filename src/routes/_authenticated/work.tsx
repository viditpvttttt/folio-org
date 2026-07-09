import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase, LogOut, Loader2, Wand2, RefreshCw, Copy,
  Users, Mail, FileText, ClipboardList, FileSignature, Presentation,
} from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/work")({
  component: WorkPage,
  head: () => ({
    meta: [
      { title: "Work · Folio" },
      { name: "description", content: "Meeting briefs, email drafts, doc summaries, standups, one-pagers, and slide outlines — powered by Folio." },
    ],
  }),
});

type Mode = "meeting" | "email" | "summarize" | "standup" | "onepager" | "slides";

const TOOLS: Array<{
  id: Mode;
  label: string;
  icon: typeof Users;
  hint: string;
  placeholder: string;
  gradient: string;
}> = [
  {
    id: "meeting",
    label: "Meeting prep",
    icon: Users,
    hint: "Paste the agenda, attendees, or topic. Get a briefing with talking points and smart questions.",
    placeholder: "1:1 with the VP of Product tomorrow. Agenda: Q4 roadmap trade-offs, hiring plan, and how launch-week metrics compare to Q3.",
    gradient: "from-indigo-500/30 to-blue-500/10",
  },
  {
    id: "email",
    label: "Email drafting",
    icon: Mail,
    hint: "Say who you're writing to, the goal, and the tone (formal, friendly, decline, follow-up).",
    placeholder: "Friendly but firm follow-up to a vendor who missed a delivery deadline. Ask for a new date by EOD Friday and a discount for the delay.",
    gradient: "from-rose-500/30 to-pink-500/10",
  },
  {
    id: "summarize",
    label: "Doc summarizer",
    icon: FileText,
    hint: "Paste notes, a meeting transcript, or a long doc. Get TL;DR, decisions, and action items.",
    placeholder: "Paste your notes or transcript here…",
    gradient: "from-emerald-500/30 to-teal-500/10",
  },
  {
    id: "standup",
    label: "Standup / status",
    icon: ClipboardList,
    hint: "Rough bullets in, polished standup out — yesterday, today, blockers.",
    placeholder: "- shipped billing v2\n- reviewed 3 PRs\n- blocked on infra rate limit\n- today: onboarding redesign, sync w/ design",
    gradient: "from-amber-500/30 to-orange-500/10",
  },
  {
    id: "onepager",
    label: "One-pager",
    icon: FileSignature,
    hint: "Turn a proposal or idea into an exec one-pager: problem, proposal, metrics, ask.",
    placeholder: "Idea: move our support team to a shared inbox tool. Currently spread across email, Slack, and a shared doc; SLA slipping to 22h.",
    gradient: "from-violet-500/30 to-fuchsia-500/10",
  },
  {
    id: "slides",
    label: "Slide outline",
    icon: Presentation,
    hint: "Give a topic and audience. Get a 6-10 slide outline with speaker notes.",
    placeholder: "Deck for the board about our new AI-first strategy. Audience: non-technical board members. 15-minute slot.",
    gradient: "from-cyan-500/30 to-sky-500/10",
  },
];

function WorkPage() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("meeting");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const active = TOOLS.find((t) => t.id === mode)!;

  const run = async () => {
    const q = input.trim();
    if (q.length < 2) return;
    setOutput("");
    setStreaming(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input: q }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Work failed (${res.status})`);
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

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#60a5fa_0%,transparent_65%)] opacity-25 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,#c084fc_0%,transparent_65%)] opacity-25 blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] -z-10" />

      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Chat</Link>
          <Link to="/explain" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Explain</Link>
          <Link to="/vibecode" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Vibecode</Link>
          <Link to="/work" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium">Work</Link>
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
        <div className="mb-6 flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-foreground/70" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">For work</p>
            <h1 className="font-serif text-4xl md:text-5xl">The corporate co-pilot.</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {TOOLS.map((t) => {
            const I = t.icon;
            const isActive = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setMode(t.id); setOutput(""); setInput(""); }}
                className={cn(
                  "text-left rounded-xl border p-3 transition group relative overflow-hidden bg-gradient-to-br",
                  isActive ? "border-foreground/60 bg-foreground/5 shadow" : "border-border/60 hover:border-foreground/40 " + t.gradient,
                )}
              >
                <I className={cn("h-5 w-5 mb-2", isActive ? "text-foreground" : "text-foreground/70")} />
                <div className="text-xs font-medium">{t.label}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <active.icon className="h-5 w-5 text-foreground/70 mt-0.5" />
            <div>
              <div className="font-serif text-xl">{active.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{active.hint}</div>
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
            }}
            placeholder={active.placeholder}
            className="min-h-32 resize-y bg-background/40 border border-border/40 focus-visible:ring-1 text-sm"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              <kbd className="px-1 py-0.5 rounded bg-foreground/10 text-[10px]">⌘/Ctrl + Enter</kbd> to run
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {output && !streaming && (
                <Button size="sm" variant="ghost" onClick={run}>
                  <RefreshCw className="h-3.5 w-3.5" /> Redo
                </Button>
              )}
              <Button size="sm" onClick={run} disabled={streaming || input.trim().length < 2}>
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {streaming ? "Working…" : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        {(output || streaming) && (
          <article className="mt-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-lg prose prose-neutral dark:prose-invert max-w-none relative">
            {output && (
              <button
                onClick={copyOutput}
                className="not-prose absolute top-3 right-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            )}
            {output ? (
              <MessageResponse isAnimating={streaming}>{output}</MessageResponse>
            ) : (
              <div className="not-prose flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Drafting…
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
