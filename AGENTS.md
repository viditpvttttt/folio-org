# AGENTS.md — Base44 dev environment notes

## What this is
Folio A.I — a 3D, voice-ready AI assistant (Notion-like workspace). Built with Lovable.
Stack: TanStack Start (SSR) + Vite 7 + React 19 + Tailwind 4, Bun package manager.
Deploy target: Cloudflare (wrangler.jsonc), but dev runs via `vite dev` (Cloudflare plugin is build-only).

## Running the app
```sh
docker compose -f docker-compose.base44.yml up -d
```
- Dev server: Vite on port 5173 inside the container, mapped to host port 3000.
- Live reload is active (Vite HMR); edits to source appear without restart.
- Dependencies install on container start via `bun install`.

## Environment variables
- `.env` (committed) contains Supabase **publishable/anon** keys (public, safe) — needed at boot.
- `/run/base44/app.env` (platform-managed, outside repo) holds generated dev placeholders for:
  `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OAUTH_STATE_SECRET`, `APP_USER_CONNECTION_KEY_SECRET`.
- The user should replace these with real values for full functionality:
  - **LOVABLE_API_KEY** — powers AI chat, image generation, voice. Without it, AI features return "AI key missing".
  - **SUPABASE_SERVICE_ROLE_KEY** — server-side admin ops (bypasses RLS). Without it, admin routes fail.
  - **OAUTH_STATE_SECRET** / **APP_USER_CONNECTION_KEY_SECRET** — needed for OAuth connector flows.

## Key architecture notes
- SSR: `src/server.ts` is the Cloudflare/Nitro entry; TanStack Start handles SSR via `@tanstack/react-start/server-entry`.
- Auth: Supabase (client `src/integrations/supabase/client.ts`, server `client.server.ts`, middleware `auth-middleware.ts`).
- Routes: file-based in `src/routes/` — `_authenticated/` routes require a Supabase session.
- AI: routes under `src/routes/api/` call Lovable's AI gateway (`ai.gateway.lovable.dev`) with `LOVABLE_API_KEY`.

## Verifying it works
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- Landing page renders with SSR HTML (title: "Folio — the assistant that lives in one calm place").
- `/login` route exists for Supabase auth.
