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
  ConversationEmptyState,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { createThread, deleteThread, getThreadMessages, listThreads } from "@/lib/threads.functions";
import { cn } from "@/lib/utils";

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
      headers: () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
                <ConversationEmptyState
                  title="Hey — what's on your mind?"
                  description="Ask anything. Brainstorm, plan, draft, decide, vent. I'm here."
                />
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
                      {m.parts.map((p, i) =>
                        p.type === "text" ? (
                          m.role === "assistant" ? (
                            <MessageResponse key={i}>{p.text}</MessageResponse>
                          ) : (
                            <span key={i}>{p.text}</span>
                          )
                        ) : null,
                      )}
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
