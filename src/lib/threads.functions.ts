import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PersistedMessage = { id: string; role: "user" | "assistant" | "system"; parts: unknown };


export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads").insert({ user_id: context.userId, title: "New chat" }).select().single();
    if (error) throw error;
    return data;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw error;
  });

export const getThreadMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("messages").select("*").eq("thread_id", data.threadId).order("created_at", { ascending: true });
    if (error) throw error;
    return rows.map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant" | "system",
      parts: (Array.isArray(r.parts) ? r.parts : []) as unknown,
    })) satisfies PersistedMessage[];
  });

