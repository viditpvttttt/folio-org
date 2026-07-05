## Goal

Let each Folio user connect their own third-party accounts via real OAuth. Start with **GitHub** as the first, fully working provider, plus a scaffold that makes adding more (Notion, Linear, Google Calendar, Spotify…) a copy-paste job.

## Scope of this change

1. **Database** — new `user_connections` table
   - Columns: `id`, `user_id`, `provider` (`github` | `notion` | …), `access_token`, `refresh_token`, `expires_at`, `scope`, `account_label`, `created_at`, `updated_at`.
   - RLS: owner-only read/update/delete. Tokens never leave the server — the client only sees `provider`, `account_label`, `scope`, `connected_at`.

2. **OAuth infrastructure**
   - `src/routes/api/public/oauth/$provider/start.ts` — signs current user in the state param, redirects to provider `authorize`.
   - `src/routes/api/public/oauth/$provider/callback.ts` — exchanges `code` → tokens, upserts into `user_connections`, closes the popup.
   - Server helper `src/lib/oauth.server.ts` — per-provider config (auth URL, token URL, scopes, `me` endpoint for label), signed state (HMAC over `user_id + nonce + expiry`).

3. **First provider: GitHub**
   - Needs two secrets: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` (user creates a GitHub OAuth App with callback `https://<app>/api/public/oauth/github/callback`).
   - Scopes: `read:user repo`.

4. **Connectors page** — `src/routes/_authenticated/connectors.tsx`
   - Cards for each provider: status (Connected / Not connected), account label, scope chips, Connect / Disconnect buttons.
   - Connect opens the OAuth start URL in a popup; on close we refetch the list.
   - Nav link added to dashboard/header.

5. **Server functions** — `src/lib/connections.functions.ts`
   - `listConnections()` → sanitized rows (no tokens).
   - `disconnectProvider({ provider })` → deletes the row.

6. **Chat integration** — one working tool per connected provider, starting with:
   - `githubListRepos` — lists the user's top repos via their token.
   - `githubSearchIssues` — searches issues across their repos.
   - Tools check for a live token, refresh if needed, and if the user isn't connected return a friendly message telling them to visit `/connectors`.

7. **UI polish** — matching Folio's glass/RGB aesthetic (TiltCard, aurora blobs, OrbStatus dot showing connection health).

## What I will NOT do in this pass

- Won't try to reuse the workspace-level "Standard Connectors" tools — those authenticate the workspace owner (you), not each app user; wrong shape for this feature.
- Won't touch the existing Supabase Google sign-in flow — provider tokens from login are session-scoped and not durable enough for API calls.
- Won't add Notion / Linear / Spotify in this pass — the scaffold is ready; each new provider is ~40 lines once you supply its Client ID + Secret.

## What I need from you before shipping

1. Confirm **GitHub** as the first provider (or pick a different one — the scaffold is identical).
2. Create a GitHub OAuth App at https://github.com/settings/developers with callback
   `https://<your-lovable-app-domain>/api/public/oauth/github/callback`
   and paste the **Client ID** and **Client Secret** when I request them via the secure secret prompt.

Reply "go" (with the provider confirmed) and I'll build it end-to-end.
