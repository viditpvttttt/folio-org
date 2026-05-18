import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Page = Tables<"pages">;
export type Task = Tables<"tasks">;
export type Profile = Tables<"profiles">;

export type Block =
  | { id: string; type: "h1" | "h2" | "text" | "quote"; text: string }
  | { id: string; type: "todo"; text: string; done: boolean }
  | { id: string; type: "divider" };

const PAGE_COLORS = ["#0d0d0d", "#2d2d2d", "#5c2018", "#0c2340", "#4a6741", "#6b3a2a"];
const PAGE_ICONS = ["📄", "📓", "📐", "✦", "◆", "❍", "✶"];

export function usePages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as Page[];
    },
  });
}

export function useCreatePage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input?: Partial<TablesInsert<"pages">>) => {
      if (!user) throw new Error("no user");
      const n = Math.random();
      const angle = n * Math.PI * 2;
      const r = 3 + Math.random() * 2;
      const insert: TablesInsert<"pages"> = {
        user_id: user.id,
        title: input?.title ?? "Untitled",
        icon: input?.icon ?? PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)],
        color: input?.color ?? PAGE_COLORS[Math.floor(Math.random() * PAGE_COLORS.length)],
        pos_x: input?.pos_x ?? Math.cos(angle) * r,
        pos_y: input?.pos_y ?? (Math.random() - 0.5) * 2,
        pos_z: input?.pos_z ?? Math.sin(angle) * r,
        content: input?.content ?? [{ id: crypto.randomUUID(), type: "h1", text: "Untitled" }],
      };
      const { data, error } = await supabase.from("pages").insert(insert).select().single();
      if (error) throw error;
      return data as Page;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & TablesUpdate<"pages">) => {
      const { error } = await supabase.from("pages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks").select("*").order("position", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { title: string; status?: "todo" | "doing" | "done" }) => {
      if (!user) throw new Error("no user");
      const { data, error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: input.title,
        status: input.status ?? "todo",
        position: Date.now(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & TablesUpdate<"tasks">) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}
