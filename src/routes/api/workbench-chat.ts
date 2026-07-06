import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { runCodeTool, generateImageTool } from "@/lib/skill-tools.server";

type Body = { messages?: UIMessage[]; projectId?: string };

const SYSTEM = `You are Folio Workbench — a focused, senior pair-programmer.
The user is working inside a small in-browser code scratchpad. You have direct access to their project files via tools:

- listFiles: list every file in the current project (path + size).
- readFile: read a file's full contents by path.
- writeFile: create or overwrite a file. Use for real edits — do NOT paste code back in chat if a writeFile can do it.
- runCode: run a short JavaScript snippet in a sandbox and get the stdout (2s timeout, no network).
- generateImage: generate an image if the user asks for a visual asset.

Rules:
- Before editing, read the file first. Prefer targeted rewrites over dumping the whole project.
- After you write a file, briefly say what changed. Never re-print the whole file in chat unless asked.
- If the user says "explain this", read the relevant file and explain concisely.
- Always use fenced markdown code blocks with the right language tag when showing code.
- Be terse and senior — no fluff, no re-listing tool output. The UI already renders it.`;

function fileTools(sb: ReturnType<typeof createClient<Database>>, projectId: string, userId: string) {
  return {
    listFiles: tool({
      description: "List every file in the current workbench project.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await sb
          .from("workbench_files")
          .select("path,content")
          .eq("project_id", projectId)
          .order("path");
        if (error) return { error: error.message };
        return { files: (data ?? []).map((f) => ({ path: f.path, bytes: f.content.length })) };
      },
    }),
    readFile: tool({
      description: "Read a file from the current project by path.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        const { data, error } = await sb
          .from("workbench_files")
          .select("content")
          .eq("project_id", projectId)
          .eq("path", path)
          .maybeSingle();
        if (error) return { error: error.message };
        if (!data) return { error: `No such file: ${path}` };
        return { path, content: data.content };
      },
    }),
    writeFile: tool({
      description: "Create or overwrite a file in the current project. Path is relative, like 'src/main.js'.",
      inputSchema: z.object({
        path: z.string().min(1).max(200),
        content: z.string().max(300_000),
      }),
      execute: async ({ path, content }) => {
        const { error } = await sb.from("workbench_files").upsert(
          { project_id: projectId, user_id: userId, path, content, updated_at: new Date().toISOString() },
          { onConflict: "project_id,path" },
        );
        if (error) return { error: error.message };
        await sb.from("workbench_projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
        return { path, bytes: content.length, saved: true };
      },
    }),
    runCode: runCodeTool,
    generateImage: generateImageTool,
  };
}

export const Route = createFileRoute("/api/workbench-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, projectId } = (await request.json()) as Body;
        if (!Array.isArray(messages) || !projectId) {
          return new Response("messages and projectId required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const auth = request.headers.get("authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: userRes, error: userErr } = await sb.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });

        const { data: project, error: pErr } = await sb
          .from("workbench_projects")
          .select("id")
          .eq("id", projectId)
          .maybeSingle();
        if (pErr || !project) return new Response("Project not found", { status: 404 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
          tools: fileTools(sb, projectId, userRes.user.id),
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
