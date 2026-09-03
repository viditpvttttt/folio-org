import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle, Plus, Cloud, Calculator, Ruler, Coins,
  BookOpen, Dices, CalendarClock, Sparkles, ArrowRight,
  Brain, Trash2, Newspaper, Languages, KeyRound, QrCode, ChefHat, Palette, Link2,
  Code2, ImageIcon, Terminal, Briefcase, Compass, Layers, Check, SlidersHorizontal,
} from "lucide-react";
import { AppShell, GlassCard } from "@/components/shell/AppShell";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { Marquee3D } from "@/components/fx/Marquee3D";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { FolioMark } from "@/components/brand/FolioMark";
import { Reveal } from "@/components/fx/Reveal";
import { WeatherWidget } from "@/components/chat/WeatherWidget";
import { NewsWidget } from "@/components/chat/NewsWidget";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences, DASHBOARD_WIDGETS, type Depth, type WidgetId } from "@/hooks/use-preferences";
import { supabase } from "@/integrations/supabase/client";
import { createThread, listThreads } from "@/lib/threads.functions";
import { addMemory, deleteMemory, listMemories } from "@/lib/memories.functions";


export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · Folio" },
      { name: "description", content: "Your quiet command center — quick tools, live weather and news, memory and recent conversations." },
      { property: "og:title", content: "Dashboard · Folio" },
      { property: "og:description", content: "Quick tools, live weather and news, memory and recent conversations in one calm place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "daily", label: "Daily life" },
  { id: "work", label: "Work" },
  { id: "create", label: "Create" },
  { id: "research", label: "Research" },
] as const;

const PROMPTS = [
  { icon: ImageIcon, label: "Generate image", tag: "create", q: "Draw a serene mountain lake at sunrise, watercolor" },
  { icon: Code2, label: "Explain code", tag: "work", q: "Explain the difference between debounce and throttle with a JS example" },
  { icon: Terminal, label: "Run a snippet", tag: "work", q: "Run: [1,2,3,4,5].reduce((a,b)=>a+b,0)" },
  { icon: Cloud, label: "Weather", tag: "daily", q: "What's the weather where I am right now?" },
  { icon: Calculator, label: "Quick math", tag: "daily", q: "What's 15% tip on $84.50?" },
  { icon: Ruler, label: "Convert units", tag: "daily", q: "Convert 12 miles to kilometers" },
  { icon: BookOpen, label: "Define a word", tag: "research", q: "Define 'serendipity'" },
  { icon: CalendarClock, label: "Plan my day", tag: "daily", q: "Plan my day: workout 45m, deep work 2h, lunch 30m, emails 30m" },
  { icon: Dices, label: "Pick for me", tag: "daily", q: "Flip a coin three times" },
  { icon: Sparkles, label: "Draft a message", tag: "work", q: "Draft a polite email asking for a project deadline extension" },
];

const SKILLS = [
  { icon: Cloud, label: "Weather", tag: "daily", q: "What's the weather where I am right now?" },
  { icon: Newspaper, label: "News", tag: "research", q: "Top tech headlines today" },
  { icon: Languages, label: "Translate", tag: "daily", q: "Translate 'good morning' to Japanese" },
  { icon: Coins, label: "Currency", tag: "daily", q: "Convert 250 USD to EUR" },
  { icon: BookOpen, label: "Dictionary", tag: "research", q: "Define 'serendipity'" },
  { icon: ChefHat, label: "Recipes", tag: "daily", q: "Give me a random dinner recipe" },
  { icon: Palette, label: "Palettes", tag: "create", q: "Palette from #6c5ce7" },
  { icon: KeyRound, label: "Passwords", tag: "daily", q: "Generate a 24-char password" },
  { icon: QrCode, label: "QR codes", tag: "create", q: "Make a QR code for https://folio.app" },
  { icon: Link2, label: "Web reader", tag: "research", q: "Summarize https://news.ycombinator.com" },
  { icon: Compass, label: "Deep research", tag: "research", q: "Research the state of solid-state batteries in 2026" },
  { icon: Briefcase, label: "Work mode", tag: "work", q: "Prep me for a 30-minute client kickoff call" },
];

const DEPTHS: { id: Depth; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "soft", label: "Soft 3D" },
  { id: "deep", label: "Deep 3D" },
];

function greeting(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user } = useAuth();
  const prefs = usePreferences();

  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const listMems = useServerFn(listMemories);
  const addMem = useServerFn(addMemory);
  const delMem = useServerFn(deleteMemory);

  const threadsQ = useQuery({ queryKey: ["threads", user?.id], queryFn: () => list(), enabled: !!user });
  const memsQ = useQuery({ queryKey: ["memories", user?.id], queryFn: () => listMems(), enabled: !!user });
  const now = useNow();
  const [memInput, setMemInput] = useState("");

  const startWith = async (q: string) => {
    const t = await create();
    qc.invalidateQueries({ queryKey: ["threads"] });
    try { sessionStorage.setItem(`folio.prefill.${t.id}`, q); } catch { /* ignore */ }
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const newChat = async () => {
    const t = await create();
    qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const saveMemory = async () => {
    const content = memInput.trim();
    if (!content) return;
    try {
      await addMem({ data: { content } });
      setMemInput("");
      qc.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Saved to memory");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeMemory = async (id: string) => {
    await delMem({ data: { id } });
    qc.invalidateQueries({ queryKey: ["memories"] });
  };

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const name =
    prefs.nickname.trim() ||
    profileQ.data?.display_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "friend";
  const firstName = name.split(" ")[0];

  const filter = prefs.quickFilter;
  const visible = (id: WidgetId) => prefs.widgets.includes(id);
  const toggleWidget = (id: WidgetId) =>
    prefs.update({
      widgets: prefs.widgets.includes(id)
        ? prefs.widgets.filter((w) => w !== id)
        : [...DASHBOARD_WIDGETS.map((w) => w.id)].filter((w) => w === id || prefs.widgets.includes(w)),
    });
  const matches = (tag: string) => filter === "all" || tag === filter;
  const prompts = PROMPTS.filter((p) => matches(p.tag));
  const skills = SKILLS.filter((sk) => matches(sk.tag));

  const stats = [
    { label: "Conversations", value: threadsQ.data?.length ?? 0 },
    { label: "Memories", value: memsQ.data?.length ?? 0 },
    { label: "Skills ready", value: SKILLS.length },
    { label: "Local time", value: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ];


  return (
    <AppShell
      right={
        <button
          onClick={newChat}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs text-background transition hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New chat
        </button>
      }
    >
      <main className="relative z-10">
        {/* ---------- hero ---------- */}
        <section className="relative">
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                {" · "}
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="relative mt-6">
                <h1 className="relative font-serif text-[clamp(2.75rem,7.5vw,6rem)] leading-[0.94] tracking-tight">
                  {greeting(now.getHours())},<br />
                  <em className="italic capitalize">{firstName}.</em>
                </h1>
                <div aria-hidden className="mt-7 h-px w-56 rgb-line opacity-70" />
              </div>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Everything Folio knows, does and remembers — one calm surface. Start where you left
                off, or just say what you need.
              </p>
            </Reveal>

            <Reveal delay={175}>
              <div className="mt-10 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
                </span>
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => prefs.update({ quickFilter: f.id })}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-xs transition " +
                      (filter === f.id
                        ? "border-transparent bg-foreground text-background"
                        : "border-border/60 bg-background/60 text-foreground/75 hover:bg-foreground/5")
                    }
                  >
                    {f.label}
                  </button>
                ))}

                <span className="mx-1 hidden h-5 w-px bg-border/70 sm:block" />

                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" /> Depth
                </span>
                <div className="inline-flex rounded-full border border-border/60 bg-background/60 p-0.5">
                  {DEPTHS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => prefs.update({ depth: d.id })}
                      className={
                        "rounded-full px-3 py-1 text-xs transition " +
                        (prefs.depth === d.id ? "bg-foreground text-background" : "text-foreground/70 hover:bg-foreground/5")
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={185}>
              <details className="group mt-4 max-w-3xl rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl">
                <summary className="cursor-pointer list-none px-4 py-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Customize widgets
                </summary>
                <div className="flex flex-wrap gap-2 border-t border-border/40 p-4">
                  {DASHBOARD_WIDGETS.map((w) => {
                    const on = visible(w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWidget(w.id)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition " +
                          (on
                            ? "border-transparent bg-foreground text-background"
                            : "border-border/60 bg-background/60 text-muted-foreground hover:bg-foreground/5")
                        }
                      >
                        {on && <Check className="h-3 w-3" />} {w.label}
                      </button>
                    );
                  })}
                </div>
              </details>
            </Reveal>

            {visible("stats") && (
            <Reveal delay={190}>
              <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="card-3d rounded-2xl border border-border/60 bg-card/50 px-4 py-3 backdrop-blur-xl">
                    <div className="font-serif text-2xl tabular-nums">{s.value}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            )}

            <Reveal delay={220}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  onClick={newChat}
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition hover:opacity-90"
                >
                  Start a conversation
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <Link
                  to="/explain"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-5 py-2.5 text-sm backdrop-blur transition hover:bg-foreground/5"
                >
                  Explain something
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-5 py-2.5 text-sm backdrop-blur transition hover:bg-foreground/5"
                >
                  Customize
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- quick actions ---------- */}
        {visible("actions") && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Quick actions</p>
                  <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Start in one tap.</h2>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Each of these opens a fresh conversation, pre-loaded. You never pick a mode.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prompts.map(({ icon: Icon, label, q }, i) => (
                <Reveal key={label} delay={i * 45}>
                  <GlassCard>
                    <button onClick={() => startWith(q)} className="h-full w-full p-6 text-left">
                      <Icon className="mb-5 h-5 w-5" />
                      <div className="font-serif text-xl">{label}</div>
                      <div className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{q}</div>
                    </button>
                  </GlassCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ---------- skills ---------- */}
        {visible("skills") && (
        <section className="border-t border-border/60 bg-paper-dim/30">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Skills</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">It brought tools.</h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-10 flex flex-wrap gap-2.5">
                {skills.map(({ icon: Icon, label, q }) => (
                  <MagneticButton key={label} strength={0.22}>
                    <button
                      onClick={() => startWith(q)}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground hover:text-background"
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  </MagneticButton>
                ))}
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-8">
                <Marquee3D items={skills.map((s) => s.label)} speed={40} />
              </div>
            </Reveal>

          </div>
        </section>
        )}

        {/* ---------- live surface ---------- */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Right now</p>
              <h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Your day, at a glance.</h2>
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {visible("weather") && (
              <Reveal>
                <GlassCard className="lg:col-span-1">
                  <div className="flex items-center gap-2 border-b border-border/40 px-6 py-4">
                    <Cloud className="h-4 w-4" />
                    <span className="font-serif text-lg">Weather & news</span>
                  </div>
                  <div className="p-3">
                    <WeatherWidget />
                    <NewsWidget />
                  </div>
                </GlassCard>
              </Reveal>
              )}

              {visible("memory") && (
              <Reveal delay={90}>
                <GlassCard>
                  <div className="flex items-center gap-2 border-b border-border/40 px-6 py-4">
                    <Brain className="h-4 w-4" />
                    <span className="font-serif text-lg">Memory</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                      {memsQ.data?.length ?? 0} saved
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Facts Folio keeps across conversations — your city, your tone, your stack.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={memInput}
                        onChange={(e) => setMemInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveMemory(); }}
                        placeholder="e.g. I live in Berlin"
                        className="h-9 min-w-0 flex-1 rounded-full border border-border/60 bg-background/60 px-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={saveMemory}
                        className="h-9 shrink-0 rounded-full bg-foreground px-4 text-sm text-background hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                    <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                      {(memsQ.data ?? []).map((m) => (
                        <li key={m.id} className="group/mem flex items-start gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm">
                          <span className="mt-1 shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">{m.kind}</span>
                          <span className="min-w-0 flex-1">{m.content}</span>
                          <button
                            onClick={() => removeMemory(m.id)}
                            className="opacity-0 transition group-hover/mem:opacity-60 hover:opacity-100"
                            aria-label="Forget"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                      {memsQ.data && memsQ.data.length === 0 && (
                        <li className="py-4 text-center text-xs text-muted-foreground">Nothing remembered yet.</li>
                      )}
                    </ul>
                  </div>
                </GlassCard>
              </Reveal>
              )}

              {visible("recent") && (
              <Reveal delay={180}>
                <GlassCard>
                  <div className="flex items-center gap-2 border-b border-border/40 px-6 py-4">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-serif text-lg">Recent</span>
                  </div>
                  <ul className="max-h-[19rem] divide-y divide-border/40 overflow-y-auto">
                    {(threadsQ.data ?? []).slice(0, 8).map((t) => (
                      <li key={t.id}>
                        <Link
                          to="/chat/$threadId"
                          params={{ threadId: t.id }}
                          className="group/row flex items-center gap-3 px-6 py-3.5 text-sm transition hover:bg-foreground/5"
                        >
                          <span className="min-w-0 flex-1 truncate">{t.title || "New chat"}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover/row:translate-x-0.5" />
                        </Link>
                      </li>
                    ))}
                    {threadsQ.data && threadsQ.data.length === 0 && (
                      <li className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No conversations yet.
                      </li>
                    )}
                  </ul>
                </GlassCard>
              </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* ---------- closing ---------- */}
        <section className="relative overflow-hidden border-t border-border/60 bg-paper-dim/30">
          <div aria-hidden className="pointer-events-none absolute inset-0">
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-[1fr_auto] md:py-32">
            <Reveal>
              <div>
                <h2 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Ask it anything.<br /><em className="italic">It brings something back.</em>
                </h2>
                <button
                  onClick={newChat}
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background transition hover:opacity-90"
                >
                  Open Folio <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="group mx-auto">
                <FolioMark className="h-40 w-40 md:h-56 md:w-56" />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
