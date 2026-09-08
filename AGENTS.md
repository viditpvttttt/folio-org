# Base44 Dev Environment — Folio AI

## Stack
- **Runtime**: Bun (oven/bun:1 Docker image)
- **Framework**: Vite 7 + TanStack Start (SSR) + React 19 + TanStack Router
- **Styling**: Tailwind CSS v4
- **Backend**: Remote Supabase (Postgres + Auth) — credentials in `.env`
- **3D**: three.js / @react-three/fiber / drei
- **AI**: Lovable API (requires `LOVABLE_API_KEY`)

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Dev server on port 3000, bind 0.0.0.0, live reload via Vite HMR.
- `bun install` runs on every container start (fast, ~8s).
- Source is bind-mounted at `/app`; edits hot-reload without rebuild.

## Environment variables
- **Required to boot** (already in `.env`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and their `VITE_` counterparts.
- **Optional** (only needed for specific features, not booting):
  - `LOVABLE_API_KEY` — AI chat, voice, explain, work features (returns 500 if missing)
  - `SUPABASE_SERVICE_ROLE_KEY` — server-side admin Supabase ops (bypasses RLS)
  - `OAUTH_STATE_SECRET` — HMAC secret for OAuth state signing
  - `APP_USER_CONNECTION_KEY_SECRET` — base64 32-byte AES key for connection key encryption
  - Google/GitHub/Linear/Slack OAuth client IDs & secrets — connector features

## Verifying
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- Landing page renders Folio hero with 3D world layer, depth slabs, scroll progress.
- Supabase client is lazy (Proxy) — only created on first auth call.
