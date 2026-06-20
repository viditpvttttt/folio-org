import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are Folio — a calm, warm, world-class personal assistant for everyday life.
You help with planning the day, thinking through decisions, drafting messages, explaining things simply, and just talking.
Speak in a friendly, concise, human voice. Use light markdown (headings, bullets, **bold**) when it actually helps.
Avoid corporate filler. Be specific. If a request is ambiguous, ask one focused question instead of guessing.`;

type Body = { messages?: UIMessage[]; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId } = (await request.json()) as Body;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("messages and threadId required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const userId = userRes.user.id;

        const { data: thread, error: threadErr } = await supabase
          .from("threads").select("id").eq("id", threadId).maybeSingle();
        if (threadErr || !thread) return new Response("Thread not found", { status: 404 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              const last = finalMessages[finalMessages.length - 1];
              const userMsg = [...finalMessages].reverse().find((m) => m.role === "user");
              if (userMsg) {
                await supabase.from("messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: userMsg.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
                });
              }
              if (last && last.role === "assistant") {
                await supabase.from("messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: last.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
                });
              }
              await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
              // auto-title from first user message
              if (userMsg) {
                const { data: existing } = await supabase
                  .from("threads").select("title").eq("id", threadId).maybeSingle();
                if (existing && (existing.title === "New chat" || !existing.title)) {
                  const text = userMsg.parts
                    .map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ").trim().slice(0, 60);
                  if (text) await supabase.from("threads").update({ title: text }).eq("id", threadId);
                }
              }
            } catch (e) {
              console.error("persist messages failed", e);
            }
          },
        });
      },
    },
  },
});
