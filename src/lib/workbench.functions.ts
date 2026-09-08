import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

function sb() {
  const auth = getRequestHeader("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) throw new Error("Unauthorized");
  const client = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return { client, token };
}

async function requireUser() {
  const { client, token } = sb();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return { client, userId: data.user.id };
}

const STARTER_FILES: { path: string; content: string }[] = [
  {
    path: "README.md",
    content: `# New Workbench Project

Welcome to your Workbench. Edit files on the left, ask Folio to help on the right.

- Ask "add a fibonacci function to main.js"
- Ask "explain what this file does"
- Ask "run this snippet" for JS output
`,
  },
  {
    path: "main.js",
    content: `// Hello from Folio Workbench.
// Try: console.log([1,2,3,4,5].map(n => n * n))
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));
`,
  },
];

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { client } = await requireUser();
  const { data, error } = await client
    .from("workbench_projects")
    .select("id,name,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
});

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((i: { name?: string }) => z.object({ name: z.string().min(1).max(80).default("Untitled project") }).parse(i))
  .handler(async ({ data }) => {
    const { client, userId } = await requireUser();
    const { data: p, error } = await client
      .from("workbench_projects")
      .insert({ user_id: userId, name: data.name })
      .select("id,name,created_at,updated_at")
      .single();
    if (error || !p) throw new Error(error?.message ?? "Failed to create");
    await client.from("workbench_files").insert(
      STARTER_FILES.map((f) => ({ project_id: p.id, user_id: userId, path: f.path, content: f.content })),
    );
    return p;
  });

export const renameProject = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string; name: string }) => z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ data }) => {
    const { client } = await requireUser();
    const { error } = await client.from("workbench_projects").update({ name: data.name }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { client } = await requireUser();
    const { error } = await client.from("workbench_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listFiles = createServerFn({ method: "GET" })
  .inputValidator((i: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { client } = await requireUser();
    const { data: rows, error } = await client
      .from("workbench_files")
      .select("id,path,content,updated_at")
      .eq("project_id", data.projectId)
      .order("path");
    if (error) throw new Error(error.message);
    return rows;
  });

export const saveFile = createServerFn({ method: "POST" })
  .inputValidator((i: { projectId: string; path: string; content: string }) =>
    z.object({
      projectId: z.string().uuid(),
      path: z.string().min(1).max(200),
      content: z.string().max(300_000),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { client, userId } = await requireUser();
    const { error } = await client
      .from("workbench_files")
      .upsert(
        { project_id: data.projectId, user_id: userId, path: data.path, content: data.content, updated_at: new Date().toISOString() },
        { onConflict: "project_id,path" },
      );
    if (error) throw new Error(error.message);
    await client.from("workbench_projects").update({ updated_at: new Date().toISOString() }).eq("id", data.projectId);
    return { ok: true };
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { client } = await requireUser();
    const { error } = await client.from("workbench_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFiles = createServerFn({ method: "POST" })
  .inputValidator((i: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { client } = await requireUser();
    const { error } = await client.from("workbench_files").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: data.ids.length };
  });
