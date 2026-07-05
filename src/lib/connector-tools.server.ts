// Chat tools for connected third-party providers.
// Called from src/routes/api/chat.ts with the request-scoped, user-auth'd supabase client.

import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type SB = ReturnType<typeof createClient<Database>>;

async function loadConnection(sb: SB, provider: string) {
  const { data } = await sb
    .from("user_connections")
    .select("access_token, refresh_token, expires_at, scope, account_label")
    .eq("provider", provider)
    .maybeSingle();
  return data;
}

async function refreshGoogleToken(sb: SB, refreshToken: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials missing");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!r.ok) throw new Error(`Google refresh failed (${r.status})`);
  const j = (await r.json()) as { access_token: string; expires_in?: number };
  const expiresAt = j.expires_in ? new Date(Date.now() + j.expires_in * 1000).toISOString() : null;
  await sb.from("user_connections").update({ access_token: j.access_token, expires_at: expiresAt }).eq("provider", "google");
  return j.access_token;
}

async function getGoogleAccessToken(sb: SB): Promise<string | null> {
  const conn = await loadConnection(sb, "google");
  if (!conn) return null;
  if (conn.expires_at && new Date(conn.expires_at).getTime() - 60_000 < Date.now() && conn.refresh_token) {
    try { return await refreshGoogleToken(sb, conn.refresh_token); } catch { return conn.access_token; }
  }
  return conn.access_token;
}

const notConnected = (label: string) => ({
  error: `${label} is not connected. Visit /connectors to connect it.`,
  notConnected: true as const,
});

// ---------- Gmail ----------

function b64urlEncode(s: string) {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function gmailListTool(sb: SB) {
  return tool({
    description: "List the user's recent Gmail messages. Optional Gmail-search query (e.g. 'is:unread', 'from:x@y.com').",
    inputSchema: z.object({
      query: z.string().optional().describe("Gmail search string"),
      limit: z.number().int().min(1).max(15).default(8),
    }),
    execute: async ({ query, limit }) => {
      const token = await getGoogleAccessToken(sb);
      if (!token) return notConnected("Gmail");
      const u = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      u.searchParams.set("maxResults", String(limit));
      if (query) u.searchParams.set("q", query);
      const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return { error: `Gmail list failed (${r.status})` };
      const list = (await r.json()) as { messages?: { id: string }[] };
      const ids = (list.messages ?? []).slice(0, limit);
      const messages = await Promise.all(
        ids.map(async ({ id }) => {
          const mr = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!mr.ok) return null;
          const m = (await mr.json()) as { id: string; snippet?: string; payload?: { headers?: { name: string; value: string }[] } };
          const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value;
          return { id: m.id, from: h("From"), subject: h("Subject"), date: h("Date"), snippet: m.snippet };
        }),
      );
      return { count: messages.filter(Boolean).length, messages: messages.filter(Boolean) };
    },
  });
}

export function gmailSendTool(sb: SB) {
  return tool({
    description: "Send an email from the user's connected Gmail account. Always confirm intent before calling.",
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(8000),
    }),
    execute: async ({ to, subject, body }) => {
      const token = await getGoogleAccessToken(sb);
      if (!token) return notConnected("Gmail");
      const raw = b64urlEncode(
        [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset="UTF-8"', "", body].join("\r\n"),
      );
      const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!r.ok) {
        const t = await r.text();
        return { error: `Gmail send failed (${r.status}): ${t.slice(0, 200)}` };
      }
      const j = (await r.json()) as { id: string; threadId: string };
      return { sent: true, id: j.id, to, subject };
    },
  });
}

export function gmailReadTool(sb: SB) {
  return tool({
    description: "Fetch the full text body of a Gmail message by ID (from gmailListMessages).",
    inputSchema: z.object({ id: z.string().min(4) }),
    execute: async ({ id }) => {
      const token = await getGoogleAccessToken(sb);
      if (!token) return notConnected("Gmail");
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return { error: `Gmail read failed (${r.status})` };
      const m = (await r.json()) as {
        payload?: { mimeType?: string; body?: { data?: string }; parts?: { mimeType?: string; body?: { data?: string } }[] };
        snippet?: string;
      };
      const findText = (payload: NonNullable<typeof m.payload> | undefined): string | null => {
        if (!payload) return null;
        if (payload.mimeType === "text/plain" && payload.body?.data) return b64urlDecode(payload.body.data);
        for (const p of payload.parts ?? []) {
          if (p.mimeType === "text/plain" && p.body?.data) return b64urlDecode(p.body.data);
        }
        return null;
      };
      return { id, snippet: m.snippet, body: findText(m.payload)?.slice(0, 6000) ?? m.snippet };
    },
  });
}

// ---------- Notion ----------

export function notionSearchTool(sb: SB) {
  return tool({
    description: "Search the user's Notion workspace for pages and databases.",
    inputSchema: z.object({
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(20).default(8),
    }),
    execute: async ({ query, limit }) => {
      const conn = await loadConnection(sb, "notion");
      if (!conn) return notConnected("Notion");
      const r = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${conn.access_token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, page_size: limit }),
      });
      if (!r.ok) return { error: `Notion search failed (${r.status})` };
      const j = (await r.json()) as { results?: Array<Record<string, unknown>> };
      const items = (j.results ?? []).slice(0, limit).map((n) => {
        const nn = n as { id: string; object: string; url?: string; properties?: Record<string, { title?: { plain_text: string }[] }>; last_edited_time?: string };
        let title = "(untitled)";
        for (const p of Object.values(nn.properties ?? {})) {
          if (p?.title?.length) { title = p.title.map((t) => t.plain_text).join(""); break; }
        }
        return { id: nn.id, kind: nn.object, title, url: nn.url, editedAt: nn.last_edited_time };
      });
      return { workspace: conn.account_label, count: items.length, items };
    },
  });
}

// ---------- Vercel ----------

export function vercelProjectsTool(sb: SB) {
  return tool({
    description: "List the user's Vercel projects and their latest deployment status.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(10) }),
    execute: async ({ limit }) => {
      const conn = await loadConnection(sb, "vercel");
      if (!conn) return notConnected("Vercel");
      const r = await fetch(`https://api.vercel.com/v9/projects?limit=${limit}`, {
        headers: { Authorization: `Bearer ${conn.access_token}` },
      });
      if (!r.ok) return { error: `Vercel API failed (${r.status})` };
      const j = (await r.json()) as { projects?: Array<{ id: string; name: string; framework?: string; latestDeployments?: Array<{ url?: string; state?: string; createdAt?: number }> }> };
      const projects = (j.projects ?? []).slice(0, limit).map((p) => ({
        id: p.id,
        name: p.name,
        framework: p.framework,
        latestUrl: p.latestDeployments?.[0]?.url ? `https://${p.latestDeployments[0].url}` : null,
        latestState: p.latestDeployments?.[0]?.state ?? null,
      }));
      return { account: conn.account_label, count: projects.length, projects };
    },
  });
}

// ---------- Cursor ----------

export function cursorStatusTool(sb: SB) {
  return tool({
    description: "Check the user's Cursor connection status. (Cursor does not expose a public usage API yet.)",
    inputSchema: z.object({}),
    execute: async () => {
      const conn = await loadConnection(sb, "cursor");
      if (!conn) return notConnected("Cursor");
      return {
        account: conn.account_label ?? "Cursor account",
        message: "Cursor token is stored securely. Cursor doesn't publish a public usage/billing API yet, so calls will be added when they do.",
      };
    },
  });
}
