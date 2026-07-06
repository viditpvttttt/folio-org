## Scope

Two tracks, shipped together:

**A. New skills for Folio (in chat)**
1. Image generation — user says "draw / make an image of…" and Folio streams a picture into the chat bubble.
2. Image editing — user attaches a photo + instruction, Folio returns an edited PNG.
3. Code writing + explaining — proper syntax-highlighted code blocks with a Copy button and language badge.
4. Code execution (sandbox) — small JS + Python snippets run server-side, stdout/stderr rendered under the assistant message.

**B. New "Workbench" section** (Codex / Claude Code / Cursor style)
A dedicated page at `/workbench` where you can:
- Open a file tree (in-memory project stored per user in DB — no local disk).
- Edit files in a Monaco editor with syntax highlighting for TS/JS/Python/HTML/CSS/JSON/MD.
- Chat with Folio in a right-hand panel that has *tools to read/write files in the current workbench project* and run snippets.
- Save named projects, load them back later.

This is scoped as a personal scratchpad + AI pair-programmer — not a full container-based IDE. No git, no npm install, no long-running processes. Snippets run once and return output.

**C. UI/UX polish (all four areas you picked)**
1. Chat room polish — attachment thumbnails, streaming shimmer, better tool cards, inline image render, code blocks with copy, subtle bubble styling.
2. Dashboard density — better grid, real stats (message count, memory count, connectors connected, files attached), the RGB blob already there, quick-start cards.
3. Mobile layout — every top-level page passes a 375px sweep (sidebar becomes drawer, chat composer sticks, workbench collapses to tabs).
4. Onboarding + empty states — first-run tour card on dashboard, empty chat has 4 suggested prompts, empty memories/connectors/workbench each get a real illustration + CTA.

## Build order

```text
1. Image gen + edit tool  →  wired into existing chat tool loop
2. Code block rendering + copy button + language badge  (react-markdown + shiki)
3. Code exec sandbox tool  (JS via isolated-vm on the worker; Python via Pyodide in a hidden iframe on the client, called through a tool ack)
4. Workbench route: DB schema, file tree, Monaco, save/load
5. Workbench chat panel with file-scoped tools (read_file / write_file / list_files / run_snippet)
6. Chat room visual polish pass
7. Dashboard: real stats + quick-start cards + first-run
8. Mobile sweep across / /dashboard /chat /workbench /connectors /memories
9. Empty-state illustrations + CTAs
```

## Data / infra

- Add tables: `workbench_projects (id, user_id, name, created_at, updated_at)` and `workbench_files (id, project_id, path, content, updated_at)`. Owner-only RLS via `auth.uid()`, standard GRANTs.
- No new secrets. Image gen uses existing `LOVABLE_API_KEY` (Lovable AI Gateway → `openai/gpt-image-2`, streamed).
- JS sandbox: `isolated-vm` is Node-native and does **not** run on the Cloudflare Worker runtime. Use a small hand-rolled `vm`-less evaluator — `new Function()` inside a scoped `try/catch` with a 2s wall-clock timeout, no `fetch`/`process`/`globalThis` leaks, output size-capped. Python runs client-side via Pyodide loaded lazily when the user first invokes the tool, so no server-side Python runtime is needed.
- Attachment persistence stays as-is (already using Cloud storage for chat attachments from the earlier turn).

## Out of scope (say so up front)

- Real container IDE, `npm install`, long-running dev servers, git — not this pass.
- OAuth connectors (Vercel/Gmail/Notion/Cursor) — parked as you asked.
- Multi-user collaboration on workbench projects — single-user only.

## Tech notes

- Image gen streams via `/api/generate-image` server route (SSE, `partial_images: 1`), rendered with a blur→sharp transition inside the assistant bubble. Editing uses the same route with an extra `image_url` in the multimodal body.
- Code blocks: `react-markdown` + `rehype-shiki` (already in the theme's color palette; no new fonts). Copy button on hover.
- Workbench editor: `@monaco-editor/react`, lazy-loaded so it doesn't bloat the main bundle.
- Sandbox tool response shape: `{ stdout, stderr, durationMs, truncated }`. Rendered as a collapsible tool card under the assistant message.
- All new chat tools registered in the existing `tools` object in `src/routes/api/chat.ts`; no changes to conversation storage.

If this looks right I'll start on step 1 (image gen + edit) and work down the list.