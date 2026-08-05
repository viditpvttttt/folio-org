import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import {
  FileText, FilePlus, Trash2, Save, Loader2, MessageSquare, ArrowLeft,
  Terminal, Wand2, ImageIcon, FolderOpen, Plus, Send, Sparkles,
} from "lucide-react";
import { AppBackdrop } from "@/components/shell/AppShell";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import {
  listProjects, createProject, deleteProject, renameProject,
  listFiles, saveFile, deleteFile,
} from "@/lib/workbench.functions";
import { cn } from "@/lib/utils";

const MonacoEditor = lazy(() => import("@monaco-editor/react").then((m) => ({ default: m.default })));

export const Route = createFileRoute("/_authenticated/workbench")({
  component: WorkbenchPage,
  head: () => ({
    meta: [
      { title: "Workbench · Folio" },
      { name: "description", content: "A pocket coding scratchpad with a senior AI pair programmer." },
    ],
  }),
});

function langFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  return {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", md: "markdown", json: "json", html: "html", css: "css",
    sh: "shell", yml: "yaml", yaml: "yaml", sql: "sql", rs: "rust",
    go: "go", java: "java", c: "c", cpp: "cpp", rb: "ruby",
  }[ext ?? ""] ?? "plaintext";
}

function WorkbenchPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listProjects);
  const create = useServerFn(createProject);
  const remove = useServerFn(deleteProject);
  const rename = useServerFn(renameProject);
  const files = useServerFn(listFiles);
  const save = useServerFn(saveFile);
  const dropFile = useServerFn(deleteFile);

  const projectsQ = useQuery({ queryKey: ["wb-projects"], queryFn: () => list() });
  const [projectId, setProjectId] = useState<string | null>(null);

  // Pick first project or create one
  useEffect(() => {
    if (!projectsQ.data || projectId) return;
    if (projectsQ.data.length === 0) {
      create({ data: { name: "My first project" } }).then((p) => {
        setProjectId(p.id);
        qc.invalidateQueries({ queryKey: ["wb-projects"] });
      });
    } else {
      setProjectId(projectsQ.data[0].id);
    }
  }, [projectsQ.data, projectId, create, qc]);

  const filesQ = useQuery({
    queryKey: ["wb-files", projectId],
    queryFn: () => files({ data: { projectId: projectId! } }),
    enabled: !!projectId,
  });

  const [openPath, setOpenPath] = useState<string | null>(null);
  const [buffer, setBuffer] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const openFile = filesQ.data?.find((f) => f.path === openPath) ?? null;

  useEffect(() => {
    if (!filesQ.data || filesQ.data.length === 0) return;
    if (!openPath || !filesQ.data.some((f) => f.path === openPath)) {
      const first = filesQ.data.find((f) => f.path.endsWith(".md")) ?? filesQ.data[0];
      setOpenPath(first.path);
      setBuffer(first.content);
      setDirty(false);
    }
  }, [filesQ.data, openPath]);

  useEffect(() => {
    if (openFile) {
      setBuffer(openFile.content);
      setDirty(false);
    }
  }, [openFile?.path, openFile?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async () => {
    if (!projectId || !openPath) return;
    setSaving(true);
    try {
      await save({ data: { projectId, path: openPath, content: buffer } });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["wb-files", projectId] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        persist();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const addFile = async () => {
    const name = window.prompt("New file path (e.g. src/util.js)");
    if (!name?.trim() || !projectId) return;
    await save({ data: { projectId, path: name.trim(), content: "" } });
    qc.invalidateQueries({ queryKey: ["wb-files", projectId] });
    setOpenPath(name.trim());
    setBuffer("");
  };

  const removeOpenFile = async () => {
    if (!openFile) return;
    if (!window.confirm(`Delete ${openFile.path}?`)) return;
    await dropFile({ data: { id: openFile.id } });
    setOpenPath(null);
    qc.invalidateQueries({ queryKey: ["wb-files", projectId] });
  };

  const newProject = async () => {
    const name = window.prompt("Project name", "Untitled project");
    if (!name?.trim()) return;
    const p = await create({ data: { name: name.trim() } });
    qc.invalidateQueries({ queryKey: ["wb-projects"] });
    setProjectId(p.id);
    setOpenPath(null);
  };

  const activeProject = projectsQ.data?.find((p) => p.id === projectId) ?? null;

  const renameActive = async () => {
    if (!activeProject) return;
    const name = window.prompt("Rename project", activeProject.name);
    if (!name?.trim() || name === activeProject.name) return;
    await rename({ data: { id: activeProject.id, name: name.trim() } });
    qc.invalidateQueries({ queryKey: ["wb-projects"] });
  };

  const removeActive = async () => {
    if (!activeProject) return;
    if (!window.confirm(`Delete project "${activeProject.name}" and all its files?`)) return;
    await remove({ data: { id: activeProject.id } });
    setProjectId(null);
    setOpenPath(null);
    qc.invalidateQueries({ queryKey: ["wb-projects"] });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <AppBackdrop density={0.6} />
      <CursorGlow />

      {/* Header */}
      <header className="relative z-10 h-14 flex items-center gap-3 px-4 border-b border-border/40 bg-background/40 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="p-2 rounded-md hover:bg-foreground/5"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <OrbStatus active className="h-7 w-7" />
        <span className="font-serif text-lg">Workbench</span>
        <span className="text-muted-foreground/60 hidden sm:inline">·</span>
        <button
          onClick={renameActive}
          className="hidden sm:inline text-sm truncate max-w-[200px] hover:underline"
          title="Rename project"
        >
          {activeProject?.name ?? "…"}
        </button>
        <select
          value={projectId ?? ""}
          onChange={(e) => { setProjectId(e.target.value); setOpenPath(null); }}
          className="ml-2 h-8 rounded-md border border-border/60 bg-background/60 px-2 text-xs max-w-[160px]"
        >
          {projectsQ.data?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={newProject}
          className="p-1.5 rounded-md hover:bg-foreground/5 text-foreground/60"
          title="New project"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
        <button
          onClick={removeActive}
          className="p-1.5 rounded-md hover:bg-destructive/10 text-foreground/50 hover:text-destructive"
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="text-[10px] uppercase tracking-wider text-amber-400">unsaved</span>}
          <button
            onClick={persist}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-foreground text-background disabled:opacity-40 hover:opacity-90"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
          <button
            onClick={() => setShowChat((s) => !s)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition",
              showChat ? "bg-foreground/10" : "hover:bg-foreground/5 text-foreground/70",
            )}
          >
            <Sparkles className="h-3 w-3" /> Folio
          </button>
          <Link to="/chat" className="hidden md:inline text-xs px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">
            <MessageSquare className="h-3 w-3 inline mr-1" /> Chat
          </Link>
        </div>
      </header>

      {/* Body: files | editor | chat */}
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)]">
        {/* File tree */}
        <aside className="w-56 border-r border-border/40 bg-background/30 backdrop-blur-xl flex flex-col">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Files</span>
            <button onClick={addFile} className="p-1 rounded hover:bg-foreground/10" title="New file">
              <FilePlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-1 pb-2">
            {(filesQ.data ?? []).map((f) => (
              <button
                key={f.id}
                onClick={() => setOpenPath(f.path)}
                className={cn(
                  "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition",
                  openPath === f.path ? "bg-foreground/10" : "hover:bg-foreground/5 text-foreground/80",
                )}
              >
                <FileText className="h-3 w-3 shrink-0 opacity-60" />
                <span className="truncate">{f.path}</span>
              </button>
            ))}
            {filesQ.data && filesQ.data.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Empty project. Tap + to add a file.
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 text-xs">
            {openPath ? (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span className="font-mono">{openPath}</span>
                <span className="text-muted-foreground">· {langFor(openPath)}</span>
                <button
                  onClick={removeOpenFile}
                  className="ml-auto p-1 rounded hover:bg-destructive/10 text-foreground/50 hover:text-destructive"
                  title="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <span className="text-muted-foreground">Select a file</span>
            )}
          </div>
          <div className="flex-1 min-h-0 bg-neutral-950/40">
            {openPath && (
              <Suspense fallback={<div className="p-8 text-xs text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin mr-2" />Loading editor…</div>}>
                <MonacoEditor
                  height="100%"
                  path={openPath}
                  language={langFor(openPath)}
                  value={buffer}
                  onChange={(v) => { setBuffer(v ?? ""); setDirty(true); }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 12 },
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                />
              </Suspense>
            )}
          </div>
        </main>

        {/* Chat panel */}
        {showChat && projectId && (
          <WorkbenchChatPanel
            projectId={projectId}
            onFilesChanged={() => qc.invalidateQueries({ queryKey: ["wb-files", projectId] })}
          />
        )}
      </div>
    </div>
  );
}

function WorkbenchChatPanel({ projectId, onFilesChanged }: { projectId: string; onFilesChanged: () => void }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthToken(data.session?.access_token ?? null));
  }, []);

  const { messages, sendMessage, status } = useChat({
    id: projectId,
    transport: useMemo(
      () => new DefaultChatTransport({
        api: "/api/workbench-chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const t = data.session?.access_token ?? authToken;
          return t ? { Authorization: `Bearer ${t}` } : {};
        },
        body: { projectId },
      }),
      [projectId, authToken],
    ),
    onError: (e) => toast.error(e.message),
    onFinish: () => onFilesChanged(),
  });

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";
  const submit = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    sendMessage({ text: t });
    setInput("");
  };
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, status]);

  return (
    <aside className="w-[380px] border-l border-border/40 bg-background/30 backdrop-blur-xl flex flex-col min-w-0">
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-serif text-sm">Pair programmer</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Gemini</span>
      </div>
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="px-3 py-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-xs text-muted-foreground text-center px-4 py-8 space-y-2">
              <p>Ask me to <em>read</em>, <em>write</em>, <em>refactor</em>, or <em>run</em> code in this project.</p>
              <div className="flex flex-col gap-1.5 pt-2">
                {[
                  "What files are in this project?",
                  "Add a fibonacci function to main.js and run it",
                  "Explain what main.js does",
                ].map((s) => (
                  <button key={s} onClick={() => sendMessage({ text: s })} className="text-left rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5 hover:bg-card/80">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
              <MessageContent className={m.role === "user" ? "bg-foreground text-background" : "bg-transparent p-0"}>
                {m.parts.map((p, i) => {
                  if (p.type === "text") return m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>;
                  if (typeof p.type === "string" && p.type.startsWith("tool-")) return <WBToolPart key={i} part={p as { type: string; state?: string; output?: unknown }} />;
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent p-0"><Shimmer>Thinking…</Shimmer></MessageContent>
            </Message>
          )}
          <div ref={bottomRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3 border-t border-border/40">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask about the code, request changes…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background disabled:opacity-40 inline-flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function WBToolPart({ part }: { part: { type: string; state?: string; output?: unknown } }) {
  const name = part.type.replace(/^tool-/, "");
  const running = part.state !== "output-available" && part.state !== "output-error";
  const labels: Record<string, string> = {
    listFiles: "Scanning project…",
    readFile: "Reading file…",
    writeFile: "Writing file…",
    runCode: "Running code…",
    generateImage: "Painting an image…",
  };
  if (running) {
    return (
      <div className="my-1 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {labels[name] ?? `Running ${name}…`}
      </div>
    );
  }
  const output = part.output as Record<string, unknown> | undefined;
  if (!output) return null;
  if ("error" in output) return <div className="my-1 text-[11px] text-destructive">{String(output.error)}</div>;

  if (name === "listFiles") {
    const o = output as { files: { path: string; bytes: number }[] };
    return (
      <div className="my-1 rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-[11px] font-mono">
        {o.files.map((f) => (
          <div key={f.path} className="flex justify-between gap-3">
            <span className="truncate">{f.path}</span>
            <span className="text-muted-foreground shrink-0">{f.bytes}b</span>
          </div>
        ))}
      </div>
    );
  }
  if (name === "readFile") {
    const o = output as { path: string; content: string };
    return (
      <div className="my-1 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-2.5 py-1 text-[11px]">
        <FileText className="h-3 w-3" />
        Read <span className="font-mono">{o.path}</span> · {o.content.length}b
      </div>
    );
  }
  if (name === "writeFile") {
    const o = output as { path: string; bytes: number };
    return (
      <div className="my-1 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
        <Save className="h-3 w-3" />
        Wrote <span className="font-mono">{o.path}</span> · {o.bytes}b
      </div>
    );
  }
  if (name === "runCode") {
    const o = output as { stdout?: string; stderr?: string; returnValue?: string; durationMs: number };
    return (
      <div className="my-1 rounded-lg border border-white/10 bg-neutral-950/90 text-neutral-100 font-mono text-[11px] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-neutral-400">
          <Terminal className="h-3 w-3" />
          <span className="uppercase tracking-[0.2em] text-[9px]">stdout</span>
          <span className="ml-auto text-[9px]">{o.durationMs}ms</span>
        </div>
        <pre className="px-3 py-2 whitespace-pre-wrap break-words">{o.stdout || <span className="italic text-neutral-500">(no output)</span>}</pre>
        {o.returnValue !== undefined && <pre className="border-t border-white/10 px-3 py-1.5 text-emerald-300 whitespace-pre-wrap">{o.returnValue}</pre>}
        {o.stderr && <pre className="border-t border-white/10 px-3 py-1.5 text-rose-300 whitespace-pre-wrap">{o.stderr}</pre>}
      </div>
    );
  }
  if (name === "generateImage") {
    const o = output as { dataUrl: string; prompt: string };
    return (
      <figure className="my-1 rounded-lg border border-border/40 bg-card/40 overflow-hidden">
        <img src={o.dataUrl} alt={o.prompt} className="w-full" />
        <figcaption className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border/40">
          <ImageIcon className="h-3 w-3" /> {o.prompt}
        </figcaption>
      </figure>
    );
  }
  return null;
}

// Keep Plus / Wand2 in the deps graph so Vite doesn't tree-shake them off dev.
void Plus;
void Wand2;
