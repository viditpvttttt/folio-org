import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, LogOut, Menu, Volume2, VolumeX, Paperclip, X, FileText } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AmbientScene } from "./AmbientScene";
import { OrbStatus } from "./OrbStatus";
import { OrbControls, DEFAULT_PHYSICS, type OrbPhysics } from "./OrbControls";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { WeatherCard, type WeatherData } from "./WeatherCard";
import { WeatherWidget } from "./WeatherWidget";
import { TiltCard } from "./TiltCard";
import { VoiceButton, speak } from "./VoiceButton";
import { CursorGlow } from "./CursorGlow";
import { Clock, CalendarClock, Loader2, Calculator, Ruler, Coins, BookOpen, Link2, Dices, Newspaper, Languages, KeyRound, QrCode, ChefHat, Palette, Smile, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createThread, deleteThread, getThreadMessages, listThreads } from "@/lib/threads.functions";
import { cn } from "@/lib/utils";


type PlanBlock = { title: string; start: string; end: string; minutes: number };

function ToolPart({ part }: { part: { type: string; state?: string; output?: unknown; input?: unknown } }) {
  const name = part.type.replace(/^tool-/, "");
  const running = part.state !== "output-available" && part.state !== "output-error";

  const labels: Record<string, string> = {
    getWeather: "Checking the sky…",
    getCurrentTime: "Reading the clock…",
    planMyDay: "Shaping your day…",
    calculate: "Crunching numbers…",
    convertUnits: "Converting…",
    convertCurrency: "Fetching exchange rate…",
    defineWord: "Opening the dictionary…",
    summarizeUrl: "Reading the page…",
    randomPick: "Rolling…",
    getNews: "Scanning headlines…",
    translateText: "Translating…",
    generatePassword: "Forging a strong password…",
    generateQrCode: "Drawing QR code…",
    getRecipe: "Looking up the recipe…",
    getColorPalette: "Mixing colors…",
    getJoke: "Thinking of a joke…",
  };

  if (running) {
    return (
      <div className="my-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
        <Loader2 className="h-3 w-3 animate-spin" />
        {labels[name] ?? `Running ${name}…`}
      </div>
    );
  }

  const output = part.output as Record<string, unknown> | undefined;
  if (!output) return null;
  if ("error" in output) {
    return <div className="my-2 text-xs text-destructive">{String(output.error)}</div>;
  }

  if (name === "getWeather") return <TiltCard max={8}><WeatherCard data={output as unknown as WeatherData} /></TiltCard>;

  if (name === "getCurrentTime") {
    const o = output as { timezone: string; formatted: string };
    return (
      <div className="my-2 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <Clock className="h-5 w-5 text-foreground/70" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{o.timezone}</div>
          <div className="font-serif text-lg leading-tight">{o.formatted}</div>
        </div>
      </div>
    );
  }

  if (name === "planMyDay") {
    const o = output as { blocks: PlanBlock[] };
    return (
      <TiltCard max={6}>
        <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <CalendarClock className="h-4 w-4" />
            <span className="font-serif text-base">Your day</span>
          </div>
          <ul className="divide-y divide-border/40">
            {o.blocks.map((b, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted-foreground tabular-nums w-24">
                  {b.start} – {b.end}
                </span>
                <span className="flex-1">{b.title}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.minutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      </TiltCard>
    );
  }


  if (name === "calculate") {
    const o = output as { expression: string; result: number };
    return (
      <div className="my-2 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <Calculator className="h-5 w-5 text-foreground/70" />
        <div>
          <div className="font-mono text-xs text-muted-foreground">{o.expression}</div>
          <div className="font-serif text-2xl leading-tight tabular-nums">{o.result}</div>
        </div>
      </div>
    );
  }

  if (name === "convertUnits") {
    const o = output as { value: number; from: string; to: string; result: number };
    return (
      <div className="my-2 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <Ruler className="h-5 w-5 text-foreground/70" />
        <div className="font-serif text-lg tabular-nums">
          {o.value} <span className="text-muted-foreground text-sm">{o.from}</span>
          <span className="mx-2 text-muted-foreground">→</span>
          {o.result} <span className="text-muted-foreground text-sm">{o.to}</span>
        </div>
      </div>
    );
  }

  if (name === "convertCurrency") {
    const o = output as { amount: number; from: string; to: string; rate: number; result: number; date: string };
    return (
      <div className="my-2 w-full max-w-sm overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-emerald-500/15 via-card/80 to-sky-500/15 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
          <Coins className="h-4 w-4" />
          <span className="font-serif text-base">Exchange</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{o.date}</span>
        </div>
        <div className="px-4 py-3">
          <div className="font-serif text-2xl tabular-nums">
            {o.amount} {o.from} <span className="text-muted-foreground">=</span> {o.result} {o.to}
          </div>
          <div className="text-xs text-muted-foreground mt-1">1 {o.from} = {o.rate} {o.to}</div>
        </div>
      </div>
    );
  }

  if (name === "defineWord") {
    const o = output as { word: string; phonetic?: string; meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[] };
    return (
      <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
          <BookOpen className="h-4 w-4" />
          <span className="font-serif text-lg">{o.word}</span>
          {o.phonetic && <span className="text-xs text-muted-foreground">{o.phonetic}</span>}
        </div>
        <div className="px-4 py-3 space-y-3">
          {o.meanings.map((m, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground italic">{m.partOfSpeech}</div>
              <ul className="mt-1 space-y-1 text-sm">
                {m.definitions.map((d, j) => (
                  <li key={j}>
                    <span>{d.definition}</span>
                    {d.example && <div className="text-xs italic text-muted-foreground">"{d.example}"</div>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (name === "summarizeUrl") {
    const o = output as { url: string; contentLength: number };
    return (
      <div className="my-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
        <Link2 className="h-3 w-3" />
        Read <span className="truncate max-w-[200px]">{o.url}</span> · {Math.round(o.contentLength / 1000)}k chars
      </div>
    );
  }

  if (name === "randomPick") {
    const o = output as { mode: string; results: (string | number)[]; sides?: number; total?: number };
    return (
      <div className="my-2 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <Dices className="h-5 w-5 text-foreground/70" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {o.mode}{o.sides ? ` · d${o.sides}` : ""}
          </div>
          <div className="font-serif text-lg">
            {o.results.join(", ")}
            {typeof o.total === "number" && o.results.length > 1 && (
              <span className="ml-2 text-sm text-muted-foreground">(sum {o.total})</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (name === "getNews") {
    const o = output as { topic: string; items: { title: string; url: string; points: number; author: string }[] };
    return (
      <TiltCard max={4}>
        <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <Newspaper className="h-4 w-4" />
            <span className="font-serif text-base">Headlines</span>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{o.topic}</span>
          </div>
          <ul className="divide-y divide-border/40">
            {o.items.map((it, i) => (
              <li key={i} className="px-4 py-2.5">
                <a href={it.url} target="_blank" rel="noreferrer" className="text-sm hover:underline">{it.title}</a>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  ▲ {it.points} · {it.author}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </TiltCard>
    );
  }

  if (name === "translateText") {
    const o = output as { source: string; from: string; to: string; translated: string };
    return (
      <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
          <Languages className="h-4 w-4" />
          <span className="font-serif text-base">Translate</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{o.from} → {o.to}</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="text-xs text-muted-foreground italic">"{o.source}"</div>
          <div className="font-serif text-xl leading-snug">{o.translated}</div>
        </div>
      </div>
    );
  }

  if (name === "generatePassword") {
    const o = output as { password: string; length: number; strength: string };
    return (
      <div className="my-2 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <KeyRound className="h-5 w-5 text-foreground/70" />
        <div>
          <div className="font-mono text-lg tracking-wide select-all">{o.password}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
            {o.length} chars · {o.strength}
          </div>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(o.password); }}
          className="ml-2 p-1.5 rounded-md hover:bg-foreground/10 transition"
          aria-label="Copy password"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (name === "generateQrCode") {
    const o = output as { content: string; imageUrl: string };
    return (
      <TiltCard max={6}>
        <div className="my-2 inline-flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-white p-4 backdrop-blur">
          <QrCode className="h-4 w-4 text-foreground/60 self-start" />
          <img src={o.imageUrl} alt="QR code" className="rounded-md" width={220} height={220} />
          <div className="text-xs text-muted-foreground max-w-[220px] truncate text-center">{o.content}</div>
        </div>
      </TiltCard>
    );
  }

  if (name === "getRecipe") {
    const o = output as { name: string; category?: string; area?: string; image?: string; instructions: string; ingredients: { name: string; measure: string }[] };
    return (
      <TiltCard max={4}>
        <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
          {o.image && <img src={o.image} alt={o.name} className="h-40 w-full object-cover" />}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span className="font-serif text-lg">{o.name}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {o.area} · {o.category}
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ingredients</div>
              <ul className="text-sm grid grid-cols-2 gap-x-3 gap-y-0.5">
                {o.ingredients.slice(0, 12).map((i, k) => (
                  <li key={k}><span className="text-muted-foreground">{i.measure}</span> {i.name}</li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-sm text-foreground/85 leading-relaxed line-clamp-6 whitespace-pre-wrap">{o.instructions}</p>
          </div>
        </div>
      </TiltCard>
    );
  }

  if (name === "getColorPalette") {
    const o = output as { base: string; colors: string[] };
    return (
      <div className="my-2 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
          <Palette className="h-4 w-4" />
          <span className="font-serif text-base">Palette</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{o.base}</span>
        </div>
        <div className="flex">
          {o.colors.map((c) => (
            <button
              key={c}
              onClick={() => navigator.clipboard?.writeText(c)}
              className="group flex-1 aspect-square relative transition hover:flex-[1.5]"
              style={{ background: c }}
              title={`Copy ${c}`}
            >
              <span className="absolute inset-x-0 bottom-1 text-[10px] font-mono text-white/90 opacity-0 group-hover:opacity-100 transition text-center drop-shadow">
                {c}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (name === "getJoke") {
    const o = output as { joke: string };
    return (
      <div className="my-2 inline-flex items-start gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur max-w-md">
        <Smile className="h-5 w-5 text-foreground/70 mt-0.5 shrink-0" />
        <div className="font-serif text-base leading-snug">{o.joke}</div>
      </div>
    );
  }

  return null;
}

export function ChatRoom({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const getMsgs = useServerFn(getThreadMessages);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [voiceAmp, setVoiceAmp] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const speakCancelRef = useRef<(() => void) | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const [physics, setPhysics] = useState<OrbPhysics>(() => {
    if (typeof window === "undefined") return DEFAULT_PHYSICS;
    try {
      const raw = window.localStorage.getItem("folio.orb-physics");
      return raw ? { ...DEFAULT_PHYSICS, ...JSON.parse(raw) } : DEFAULT_PHYSICS;
    } catch { return DEFAULT_PHYSICS; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("folio.orb-physics", JSON.stringify(physics)); } catch { /* ignore */ }
  }, [physics]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthToken(s?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const threadsQ = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => list(),
    enabled: !!user,
  });

  const initialQ = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => getMsgs({ data: { threadId } }),
    enabled: !!threadId,
  });

  const { messages, sendMessage, status, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // Fetch a fresh session on every request to avoid race conditions
      // where the in-state token isn't ready yet (causing 401 Unauthorized).
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? authToken;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      body: { threadId },
    }),
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onFinish: ({ message }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (voiceOn && message.role === "assistant" && message.id !== lastSpokenIdRef.current) {
        const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
        if (text) {
          lastSpokenIdRef.current = message.id;
          speakCancelRef.current?.();
          setSpeaking(true);
          speak(text)
            .then((cancel) => {
              speakCancelRef.current = () => { cancel(); setSpeaking(false); };
              // best-effort: clear speaking after estimated duration (~140 wpm)
              const ms = Math.max(1500, (text.split(/\s+/).length / 140) * 60_000);
              setTimeout(() => setSpeaking(false), ms);
            })
            .catch(() => setSpeaking(false));
        }
      }
    },
  });


  useEffect(() => {
    if (initialQ.data) setMessages(initialQ.data as unknown as UIMessage[]);
  }, [initialQ.data, setMessages]);

  // Pickup an optional prefill prompt handed off from the Dashboard.
  useEffect(() => {
    if (!threadId || initialQ.isLoading) return;
    try {
      const key = `folio.prefill.${threadId}`;
      const q = sessionStorage.getItem(key);
      if (q && messages.length === 0) {
        sessionStorage.removeItem(key);
        sendMessage({ text: q });
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, initialQ.isLoading]);


  const handleSubmit = async ({ text, files }: { text: string; files?: { url: string; mediaType?: string; filename?: string }[] }) => {
    const trimmed = text.trim();
    if (!trimmed && (!files || files.length === 0)) return;
    await sendMessage({
      text: trimmed || "(attached file)",
      files: files?.map((f) => ({
        type: "file" as const,
        url: f.url,
        mediaType: f.mediaType ?? "application/octet-stream",
        filename: f.filename,
      })),
    });
  };

  const handleNewChat = async () => {
    const t = await create();
    qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const handleDelete = async (id: string) => {
    await remove({ data: { id } });
    const refreshed = await list();
    qc.setQueryData(["threads", user?.id], refreshed);
    if (id === threadId) {
      const next = refreshed[0] ?? (await create());
      navigate({ to: "/chat/$threadId", params: { threadId: next.id }, replace: true });
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] -z-10" />

      <div className="flex h-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "transition-all duration-300 border-r border-border/60 bg-card/40 backdrop-blur-xl flex flex-col",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden",
          )}
        >
          <div className="px-4 pt-5 pb-3 flex items-center justify-between">
            <span className="font-serif text-2xl">Folio</span>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>
          <WeatherWidget />
          <div className="px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground py-2">
            Conversations
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {threadsQ.data?.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition",
                  t.id === threadId ? "bg-foreground/10" : "hover:bg-foreground/5",
                )}
                onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
              >
                <span className="flex-1 truncate">{t.title || "New chat"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t.id);
                  }}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 p-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{user?.email}</span>
            <button onClick={signOut} title="Sign out" className="hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="px-4 py-3 flex items-center gap-3 border-b border-border/40">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="p-2 rounded-md hover:bg-foreground/5"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <OrbStatus active={isLoading} amplitude={voiceAmp} listening={listening} speaking={speaking} {...physics} />
            <span className="font-serif text-lg">Folio</span>
            <nav className="ml-3 hidden md:flex items-center gap-1 text-xs">
              <Link to="/dashboard" className="px-2.5 py-1 rounded-full hover:bg-foreground/5 text-foreground/70 inline-flex items-center gap-1">
                <LayoutDashboard className="h-3 w-3" /> Dashboard
              </Link>
              <Link to="/chat" className="px-2.5 py-1 rounded-full bg-foreground/10 inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Chat
              </Link>
              <Link to="/settings" className="px-2.5 py-1 rounded-full hover:bg-foreground/5 text-foreground/70 inline-flex items-center gap-1">
                <SettingsIcon className="h-3 w-3" /> Settings
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <OrbControls value={physics} onChange={setPhysics} />
              <button
                onClick={() => {
                  if (voiceOn) { speakCancelRef.current?.(); speakCancelRef.current = null; }
                  setVoiceOn((v) => !v);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition",
                  voiceOn ? "bg-foreground text-background" : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70",
                )}
                aria-label="Toggle voice replies"
                title={voiceOn ? "Voice replies on" : "Voice replies off"}
              >
                {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Voice</span>
              </button>
            </div>

          </header>



          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <OrbStatus active={true} amplitude={voiceAmp} listening={listening} speaking={speaking} {...physics} className="h-32 w-32 mb-4" />
                  <h2 className="font-serif text-4xl mb-2">Good to see you.</h2>

                  <p className="text-muted-foreground mb-8 max-w-md">
                    Weather, news, translation, recipes, QR codes, palettes, passwords, math, conversions, planning — Folio is a calm one-stop assistant for the day.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                    {[
                      "Top tech headlines today",
                      "Translate 'good morning, friend' to Japanese",
                      "Generate a 24-char password",
                      "Make a QR code for https://folio.app",
                      "Give me a random dinner recipe",
                      "Palette from #6c5ce7",
                      "What's the weather in Tokyo?",
                      "Tell me a dad joke",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage({ text: s })}
                        className="text-left text-sm rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-2.5 hover:bg-card/90 hover:scale-[1.02] transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="bubble-in">
                    <Message from={m.role === "user" ? "user" : "assistant"}>
                      <MessageContent
                        className={cn(
                          m.role === "user"
                            ? "bg-foreground text-background"
                            : "bg-transparent p-0",
                        )}
                      >
                        {m.parts.map((p, i) => {
                          if (p.type === "text") {
                            return m.role === "assistant" ? (
                              <MessageResponse key={i}>{p.text}</MessageResponse>
                            ) : (
                              <span key={i}>{p.text}</span>
                            );
                          }
                          if (p.type === "file") {
                            const fp = p as unknown as { url: string; mediaType?: string; filename?: string };
                            const isImg = fp.mediaType?.startsWith("image/");
                            return isImg ? (
                              <img key={i} src={fp.url} alt={fp.filename ?? "attachment"} className="mt-1 mb-1 max-h-72 rounded-lg border border-border/60" />
                            ) : (
                              <a key={i} href={fp.url} target="_blank" rel="noreferrer" className="mt-1 mb-1 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs backdrop-blur hover:bg-card/80">
                                <FileText className="h-4 w-4" />
                                <span className="truncate max-w-[220px]">{fp.filename ?? "Attachment"}</span>
                              </a>
                            );
                          }
                          if (typeof p.type === "string" && p.type.startsWith("tool-")) {
                            return <ToolPart key={i} part={p as unknown as { type: string; state?: string; output?: unknown; input?: unknown }} />;
                          }
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  </div>
                ))

              )}
              {status === "submitted" && (
                <Message from="assistant">
                  <MessageContent className="bg-transparent p-0">
                    <Shimmer>Thinking…</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Composer with glassmorphic RGB blur halo */}
          <div className="px-4 pb-6 pt-2">
            <div className="mx-auto w-full max-w-3xl">
              {/* Live caption while listening / transcribing */}
              {(listening || interim) && (
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-foreground/90 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(255,77,141,0.45)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#ff4d8d]/70" />
                      <span className="relative h-2 w-2 rounded-full bg-[#ff4d8d]" />
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {listening ? "Listening" : "Transcribing"}
                    </span>
                    {interim && (
                      <span className="ml-1 max-w-[60vw] truncate italic text-foreground/95">
                        "{interim}"
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className={cn("relative rgb-aurora rounded-2xl p-[2px]", (isLoading || listening) && "is-loud")}
                style={{ filter: "blur(0px)" }}
              >
                {/* Outer blurred RGB halo */}
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -inset-4 rounded-[28px] rgb-aurora opacity-60",
                    (isLoading || listening) && "opacity-90 is-loud",
                  )}
                  style={{ filter: "blur(28px)" }}
                />
                <PromptInput
                  onSubmit={handleSubmit}
                  className="relative bg-background/40 backdrop-blur-2xl rounded-[14px] border border-white/15 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.5)]"
                >
                  <PromptInputTextarea
                    placeholder={listening ? "Listening…" : "Ask Folio anything — or tap the mic"}
                    autoFocus
                    disabled={isLoading}
                  />
                  <PromptInputFooter className="justify-between">
                    <VoiceButton
                      disabled={isLoading}
                      onListeningChange={setListening}
                      onAmplitude={setVoiceAmp}
                      onInterim={setInterim}
                      onTranscript={(text) => {
                        setListening(false);
                        setVoiceAmp(0);
                        setInterim("");
                        sendMessage({ text });
                      }}
                    />

                    <PromptInputSubmit status={status} disabled={isLoading} />
                  </PromptInputFooter>
                </PromptInput>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Folio · hold the mic to talk · toggle voice replies in the header
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

