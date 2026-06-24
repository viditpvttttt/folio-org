import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  MessageCircle, Plus, LogOut, Cloud, Calculator, Ruler, Coins,
  BookOpen, Dices, CalendarClock, Sparkles, Clock, ArrowRight,
} from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { TiltCard } from "@/components/chat/TiltCard";
import { WeatherWidget } from "@/components/chat/WeatherWidget";
import { useAuth } from "@/hooks/use-auth";
import { createThread, listThreads } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · Folio" },
      { name: "description", content: "Your everyday command center — quick tools, recent chats, and Folio's orb." },
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

const PROMPTS = [
  { icon: Cloud, label: "Weather", q: "What's the weather where I am right now?" },
  { icon: Calculator, label: "Quick math", q: "What's 15% tip on $84.50?" },
  { icon: Ruler, label: "Convert units", q: "Convert 12 miles to kilometers" },
  { icon: Coins, label: "Currency", q: "Convert 250 USD to EUR" },
  { icon: BookOpen, label: "Define a word", q: "Define 'serendipity'" },
  { icon: CalendarClock, label: "Plan my day", q: "Plan my day: workout 45m, deep work 2h, lunch 30m, emails 30m" },
  { icon: Dices, label: "Pick for me", q: "Flip a coin three times" },
  { icon: Sparkles, label: "Draft a message", q: "Draft a polite email asking for a project deadline extension" },
];

function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);

  const threadsQ = useQuery({ queryKey: ["threads", user?.id], queryFn: () => list(), enabled: !!user });
  const now = useNow();

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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] -z-10" />

      {/* Top nav */}
      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium">Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Chat</Link>
          <Link to="/settings" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={newChat}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New chat
          </button>
          <button onClick={signOut} title="Sign out" className="text-foreground/60 hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.4fr,1fr] gap-6 mb-10">
          <TiltCard max={4}>
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-8 h-full">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl mt-3 leading-[0.95]">
                Good to see you,<br />
                <em className="italic text-foreground/80">
                  {user?.email?.split("@")[0] ?? "friend"}.
                </em>
              </h1>
              <p className="mt-5 text-muted-foreground max-w-md">
                Folio is ready when you are. Pick a quick tool, jump into a recent chat, or just say hi.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={newChat}
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm"
                >
                  Start chatting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm hover:bg-foreground/5"
                >
                  Customize
                </Link>
              </div>
            </div>
          </TiltCard>

          <TiltCard max={6}>
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 h-full flex flex-col items-center justify-center">
              <OrbStatus active className="h-48 w-48" />
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </TiltCard>
        </section>

        {/* Quick actions */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Quick actions</h2>
            <span className="text-xs text-muted-foreground">Tap to start a chat</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PROMPTS.map(({ icon: Icon, label, q }) => (
              <TiltCard key={label} max={10}>
                <button
                  onClick={() => startWith(q)}
                  className="w-full text-left rounded-xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 hover:bg-card/80 transition group"
                >
                  <Icon className="h-5 w-5 mb-3 text-foreground/70 group-hover:text-foreground transition" />
                  <div className="font-medium text-sm">{label}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{q}</div>
                </button>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* Two columns */}
        <section className="grid lg:grid-cols-2 gap-6">
          <TiltCard max={4}>
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="font-serif text-lg">Local weather</span>
              </div>
              <div className="p-2">
                <WeatherWidget />
              </div>
            </div>
          </TiltCard>

          <TiltCard max={4}>
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-serif text-lg">Recent conversations</span>
              </div>
              <ul className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                {(threadsQ.data ?? []).slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-foreground/5 transition"
                    >
                      <span className="flex-1 truncate">{t.title || "New chat"}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
                {threadsQ.data && threadsQ.data.length === 0 && (
                  <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                    No conversations yet. Tap “New chat” to start.
                  </li>
                )}
              </ul>
            </div>
          </TiltCard>
        </section>
      </main>
    </div>
  );
}
