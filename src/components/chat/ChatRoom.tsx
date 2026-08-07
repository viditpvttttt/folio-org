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
import { AppBackdrop } from "@/components/shell/AppShell";
import { FolioMark } from "@/components/brand/FolioMark";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { WeatherCard, type WeatherData } from "./WeatherCard";
import { WeatherWidget } from "./WeatherWidget";
import { TiltCard } from "./TiltCard";
import { VoiceButton, speak } from "./VoiceButton";
import { CursorGlow } from "./CursorGlow";
import { Clock, CalendarClock, Loader2, Calculator, Ruler, Coins, BookOpen, Link2, Dices, Newspaper, Languages, KeyRound, QrCode, ChefHat, Palette, Smile, Copy, Wand2, ImageIcon, Terminal } from "lucide-react";
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
    generateImage: "Painting an image…",
    editImage: "Reworking the image…",
    runCode: "Running your code…",
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

  if (name === "generateImage" || name === "editImage") {
    const o = output as { dataUrl: string; prompt: string };
    return (
      <TiltCard max={5}>
        <figure className="my-2 w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur">
          <img src={o.dataUrl} alt={o.prompt} className="w-full object-cover" />
          <figcaption className="flex items-center gap-2 px-4 py-2.5 border-t border-border/40">
            {name === "editImage" ? <Wand2 className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            <span className="text-xs text-muted-foreground italic truncate">{o.prompt}</span>
            <a
              href={o.dataUrl}
              download={`folio-${Date.now()}.png`}
              className="ml-auto text-[10px] uppercase tracking-wider text-foreground/70 hover:text-foreground"
            >
              Save
            </a>
          </figcaption>
        </figure>
      </TiltCard>
    );
  }

  if (name === "runCode") {
    const o = output as { stdout?: string; stderr?: string; returnValue?: string; durationMs: number };
    return (
      <div className="my-2 w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-neutral-950/90 text-neutral-100 backdrop-blur font-mono text-[12px]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-neutral-400">
          <Terminal className="h-3.5 w-3.5" />
          <span className="uppercase tracking-[0.2em] text-[10px]">stdout</span>
          <span className="ml-auto text-[10px]">{o.durationMs}ms</span>
        </div>
        <pre className="px-4 py-3 whitespace-pre-wrap break-words min-h-[2.5rem]">
          {o.stdout || <span className="italic text-neutral-500">(no output)</span>}
        </pre>
        {o.returnValue !== undefined && (
          <div className="border-t border-white/10 px-4 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-1">return</div>
            <pre className="whitespace-pre-wrap break-words text-emerald-300">{o.returnValue}</pre>
          </div>
        )}
        {o.stderr && (
          <div className="border-t border-white/10 px-4 py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-1">error</div>
            <pre className="whitespace-pre-wrap break-words text-rose-300">{o.stderr}</pre>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function AttachButton() {
  const a = usePromptInputAttachments();
  return (
    <button
      type="button"
      onClick={a.openFileDialog}
      className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-border/60 bg-background/60 backdrop-blur hover:bg-foreground/10 transition"
      aria-label="Attach photo or file"
      title="Attach photo or file"
    >
      <Paperclip className="h-4 w-4" />
    </button>
  );
}

function AttachPreview() {
  const a = usePromptInputAttachments();
  if (a.files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {a.files.map((f) => {
        const isImg = f.mediaType?.startsWith("image/");
        return (
          <div key={f.id} className="relative group rounded-lg border border-border/60 bg-card/70 backdrop-blur overflow-hidden">
            {isImg ? (
              <img src={f.url} alt={f.filename ?? "attachment"} className="h-16 w-16 object-cover" />
            ) : (
              <div className="h-16 w-40 flex items-center gap-2 px-2 text-xs">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{f.filename ?? "file"}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => a.remove(f.id)}
              className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
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
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground paper-grain">
      <AppBackdrop density={0.7} />
      <CursorGlow />

      <div className="relative z-10 flex h-full">
        {/* ---------- Sidebar: the index of the folio ---------- */}
        <aside
          className={cn(
            "flex flex-col border-r border-border/50 bg-card/35 backdrop-blur-2xl transition-all duration-500",
            sidebarOpen ? "w-[17.5rem]" : "w-0 overflow-hidden",
          )}
        >
          <div className="flex items-baseline justify-between px-5 pb-4 pt-6">
            <Link to="/dashboard" className="font-serif text-2xl leading-none tracking-tight">Folio</Link>
            <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Chat</span>
          </div>

          <div className="px-4">
            <button
              onClick={handleNewChat}
              className="group flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-border"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">New conversation</span>
              <span className="font-mono text-[10px] text-muted-foreground">⌘K</span>
            </button>
          </div>

          <div className="px-4 pt-4">
            <WeatherWidget />
          </div>

          <div className="px-5 pb-2 pt-5 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Recent
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
            {threadsQ.data?.map((t) => {
              const activeThread = t.id === threadId;
              return (
                <div
                  key={t.id}
                  onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pl-4 pr-2 text-sm transition",
                    activeThread ? "bg-foreground/[0.07]" : "hover:bg-foreground/5",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-1 top-1/2 h-4 w-px -translate-y-1/2 rounded-full transition-all",
                      activeThread ? "bg-foreground/70" : "bg-transparent group-hover:bg-border",
                    )}
                  />
                  <span className={cn("flex-1 truncate", !activeThread && "text-foreground/80")}>
                    {t.title || "Untitled"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                    className="opacity-0 transition group-hover:opacity-50 hover:!opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {threadsQ.data?.length === 0 && (
              <p className="px-4 py-6 text-xs italic text-muted-foreground">Nothing written yet.</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
            <Link to="/settings" className="truncate transition hover:text-foreground">{user?.email}</Link>
            <button onClick={signOut} title="Sign out" className="ml-auto transition hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3 backdrop-blur-xl">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="rounded-md p-2 transition hover:bg-foreground/5"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <FolioMark active={isLoading} amplitude={voiceAmp} listening={listening} speaking={speaking} />
            <div className="min-w-0">
              <div className="truncate font-serif text-lg leading-tight">
                {threadsQ.data?.find((t) => t.id === threadId)?.title || "New conversation"}
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                {isLoading ? "Writing" : listening ? "Listening" : speaking ? "Speaking" : "Ready"}
              </div>
            </div>

            <nav className="ml-4 hidden items-center gap-1 text-xs md:flex">
              <Link to="/dashboard" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground">
                <LayoutDashboard className="h-3 w-3" /> Dashboard
              </Link>
              <Link to="/workbench" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground">
                <Terminal className="h-3 w-3" /> Workbench
              </Link>
              <Link to="/settings" className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground">
                <SettingsIcon className="h-3 w-3" /> Settings
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  if (voiceOn) { speakCancelRef.current?.(); speakCancelRef.current = null; }
                  setVoiceOn((v) => !v);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition",
                  voiceOn ? "bg-foreground text-background" : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10",
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
            <ConversationContent className="mx-auto w-full max-w-3xl px-6 py-10">
              {messages.length === 0 ? (
                <div className="relative flex flex-col items-center py-12 text-center">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-28 -z-10 h-[300px] w-[600px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full rgb-blob opacity-30 blur-[90px]"
                  />
                  <FolioMark
                    active={isLoading}
                    amplitude={voiceAmp}
                    listening={listening}
                    speaking={speaking}
                    className="mb-7 h-24 w-24"
                  />
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">A calm place to think</p>
                  <h2 className="mt-4 font-serif text-[clamp(2.25rem,6vw,3.5rem)] leading-[0.96] tracking-tight">
                    What are we<br /><em className="italic">doing today?</em>
                  </h2>
                  <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                    Ask in plain words. Folio picks the tool — weather, news, research, drafting,
                    translation, code, images.
                  </p>

                  <div className="mt-10 w-full max-w-2xl divide-y divide-border/40 border-y border-border/40 text-left">
                    {[
                      { k: "Today", v: "What's the weather in Tokyo, and should I take a jacket?" },
                      { k: "Read", v: "Summarise the top tech headlines from this morning" },
                      { k: "Write", v: "Draft a warm follow-up email after a client call" },
                      { k: "Make", v: "Draw a serene mountain lake at sunrise, watercolor" },
                      { k: "Build", v: "Write a Python function that flattens a nested list" },
                    ].map(({ k, v }) => (
                      <button
                        key={v}
                        onClick={() => sendMessage({ text: v })}
                        className="group flex w-full items-baseline gap-5 py-3.5 text-left transition hover:bg-foreground/[0.04]"
                      >
                        <span className="w-14 shrink-0 pl-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {k}
                        </span>
                        <span className="flex-1 text-sm text-foreground/85 transition group-hover:text-foreground">{v}</span>
                        <span className="pr-2 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-70">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <article key={m.id} className="bubble-in group/msg">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                            {isUser ? "You" : "Folio"}
                          </span>
                          <span aria-hidden className="h-px flex-1 bg-border/50" />
                        </div>
                        <div
                          className={cn(
                            "leading-relaxed",
                            isUser
                              ? "rounded-2xl rounded-tl-sm border border-border/60 bg-foreground/[0.05] px-4 py-3 text-[0.95rem] text-foreground"
                              : "prose-folio text-[1.02rem]",
                          )}
                        >
                          {m.parts.map((p, i) => {
                            if (p.type === "text") {
                              return isUser ? (
                                <span key={i} className="whitespace-pre-wrap">{p.text}</span>
                              ) : (
                                <MessageResponse key={i}>{p.text}</MessageResponse>
                              );
                            }
                            if (p.type === "file") {
                              const fp = p as unknown as { url: string; mediaType?: string; filename?: string };
                              const isImg = fp.mediaType?.startsWith("image/");
                              return isImg ? (
                                <img key={i} src={fp.url} alt={fp.filename ?? "attachment"} className="my-2 max-h-72 rounded-xl border border-border/60" />
                              ) : (
                                <a key={i} href={fp.url} target="_blank" rel="noreferrer" className="my-1 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs backdrop-blur transition hover:bg-card/80">
                                  <FileText className="h-4 w-4" />
                                  <span className="max-w-[220px] truncate">{fp.filename ?? "Attachment"}</span>
                                </a>
                              );
                            }
                            if (typeof p.type === "string" && p.type.startsWith("tool-")) {
                              return <ToolPart key={i} part={p as unknown as { type: string; state?: string; output?: unknown; input?: unknown }} />;
                            }
                            return null;
                          })}
                        </div>
                        {!isUser && (
                          <div className="mt-2 flex items-center gap-3 opacity-0 transition group-hover/msg:opacity-100">
                            <button
                              onClick={() => {
                                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").trim();
                                navigator.clipboard.writeText(text);
                                toast.success("Copied");
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {status === "submitted" && (
                <div className="mt-8">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Folio</span>
                    <span aria-hidden className="h-px flex-1 bg-border/50" />
                  </div>
                  <Shimmer>Thinking…</Shimmer>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* ---------- Composer ---------- */}
          <div className="px-6 pb-6 pt-2">
            <div className="mx-auto w-full max-w-3xl">
              {(listening || interim) && (
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm backdrop-blur-xl">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#ff4d8d]/70" />
                      <span className="relative h-2 w-2 rounded-full bg-[#ff4d8d]" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {listening ? "Listening" : "Transcribing"}
                    </span>
                    {interim && <span className="ml-1 max-w-[60vw] truncate italic text-foreground/90">"{interim}"</span>}
                  </div>
                </div>
              )}

              <div className={cn("relative rgb-aurora rounded-2xl p-px", (isLoading || listening) && "is-loud")}>
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -inset-3 rounded-[26px] rgb-aurora opacity-30 transition-opacity duration-700",
                    (isLoading || listening) && "opacity-70 is-loud",
                  )}
                  style={{ filter: "blur(24px)" }}
                />
                <PromptInput
                  onSubmit={handleSubmit}
                  accept="image/*,application/pdf,text/*,.md,.csv,.json"
                  multiple
                  maxFiles={6}
                  maxFileSize={10 * 1024 * 1024}
                  onError={(e) => toast.error(e.message)}
                  className="relative rounded-[15px] border border-border/60 bg-background/70 backdrop-blur-2xl"
                >
                  <AttachPreview />
                  <PromptInputTextarea
                    placeholder={listening ? "Listening…" : "Ask Folio anything…"}
                    autoFocus
                    disabled={isLoading}
                  />
                  <PromptInputFooter className="justify-between">
                    <div className="flex items-center gap-2">
                      <AttachButton />
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
                    </div>
                    <PromptInputSubmit status={status} disabled={isLoading} />
                  </PromptInputFooter>
                </PromptInput>
              </div>
              <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                Hold the mic to talk · voice replies toggle in the header
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


