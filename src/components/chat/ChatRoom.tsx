import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, LogOut, Menu } from "lucide-react";
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
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AmbientScene } from "./AmbientScene";
import { OrbStatus } from "./OrbStatus";
import { WeatherCard, type WeatherData } from "./WeatherCard";
import { Clock, CalendarClock, Loader2, Calculator, Ruler, Coins, BookOpen, Link2, Dices } from "lucide-react";
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

  if (name === "getWeather") return <WeatherCard data={output as unknown as WeatherData} />;

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
      headers: (): Record<string, string> => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      body: { threadId },
    }),
    onError: (e) => toast.error(e.message || "Something went wrong"),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  useEffect(() => {
    if (initialQ.data) setMessages(initialQ.data as unknown as UIMessage[]);
  }, [initialQ.data, setMessages]);

  const handleSubmit = async ({ text }: { text: string }) => {
    if (!text.trim()) return;
    await sendMessage({ text: text.trim() });
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
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] -z-10" />

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
            <span className="font-serif text-lg">Your assistant</span>
          </header>

          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <h2 className="font-serif text-4xl mb-2">Good to see you.</h2>
                  <p className="text-muted-foreground mb-8 max-w-md">
                    Folio knows the weather, the clock around the world, and how to shape a messy day into a plan. Or just talk.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-2xl">
                    {[
                      "What's the weather in Tokyo?",
                      "What time is it in New York?",
                      "Plan my day: workout 45m, deep work 2h, lunch 30m, emails 30m",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage({ text: s })}
                        className="text-left text-sm rounded-xl border border-border/60 bg-card/60 backdrop-blur px-3 py-2.5 hover:bg-card/90 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
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
                        if (typeof p.type === "string" && p.type.startsWith("tool-")) {
                          return <ToolPart key={i} part={p as unknown as { type: string; state?: string; output?: unknown; input?: unknown }} />;
                        }
                        return null;
                      })}
                    </MessageContent>
                  </Message>
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

          {/* Composer with RGB ambient glow */}
          <div className="px-4 pb-6 pt-2">
            <div className="mx-auto w-full max-w-3xl">
              <div className="rgb-aurora rounded-2xl p-[2px]">
                <PromptInput
                  onSubmit={handleSubmit}
                  className="bg-background/95 backdrop-blur rounded-[14px] border-0 shadow-lg"
                >
                  <PromptInputTextarea
                    placeholder="Ask Folio anything…"
                    autoFocus
                    disabled={isLoading}
                  />
                  <PromptInputFooter className="justify-end">
                    <PromptInputSubmit status={status} disabled={isLoading} />
                  </PromptInputFooter>
                </PromptInput>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Folio · your everyday assistant
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
