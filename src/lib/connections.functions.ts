import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PublicConnection = {
  provider: string;
  account_label: string | null;
  scope: string | null;
  connected_at: string;
};

export const listConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublicConnection[]> => {
    const { data, error } = await context.supabase
      .from("user_connections")
      .select("provider, account_label, scope, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      provider: r.provider,
      account_label: r.account_label,
      scope: r.scope,
      connected_at: r.created_at,
    }));
  });

export const disconnectProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ provider: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("user_connections")
      .delete()
      .eq("provider", data.provider);
    if (error) throw error;
    return { ok: true };
  });

export const TOKEN_PROVIDERS = [
  "vercel",
  "cursor",
  "github",
  "linear",
  "figma",
  "slack",
  "todoist",
  "openai",
] as const;
export type TokenProvider = (typeof TOKEN_PROVIDERS)[number];

/** Verify a personal token and return a human label for the account. */
async function verifyToken(provider: TokenProvider, token: string, fallback?: string): Promise<string> {
  const bearer = { Authorization: `Bearer ${token}` };
  switch (provider) {
    case "vercel": {
      const r = await fetch("https://api.vercel.com/v2/user", { headers: bearer });
      if (!r.ok) throw new Error("Invalid Vercel token");
      const j = (await r.json()) as { user?: { username?: string; email?: string } };
      return j.user?.username ?? j.user?.email ?? "Vercel account";
    }
    case "github": {
      const r = await fetch("https://api.github.com/user", {
        headers: { ...bearer, Accept: "application/vnd.github+json", "User-Agent": "Folio" },
      });
      if (!r.ok) throw new Error("Invalid GitHub token");
      const j = (await r.json()) as { login?: string; name?: string };
      return j.login ?? j.name ?? "GitHub account";
    }
    case "linear": {
      const r = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ viewer { name email } }" }),
      });
      const j = (await r.json()) as { data?: { viewer?: { name?: string; email?: string } } };
      if (!r.ok || !j.data?.viewer) throw new Error("Invalid Linear API key");
      return j.data.viewer.name ?? j.data.viewer.email ?? "Linear account";
    }
    case "figma": {
      const r = await fetch("https://api.figma.com/v1/me", { headers: { "X-Figma-Token": token } });
      if (!r.ok) throw new Error("Invalid Figma token");
      const j = (await r.json()) as { handle?: string; email?: string };
      return j.handle ?? j.email ?? "Figma account";
    }
    case "slack": {
      const r = await fetch("https://slack.com/api/auth.test", { method: "POST", headers: bearer });
      const j = (await r.json()) as { ok?: boolean; user?: string; team?: string; error?: string };
      if (!j.ok) throw new Error(`Slack rejected the token${j.error ? `: ${j.error}` : ""}`);
      return [j.user, j.team].filter(Boolean).join(" · ") || "Slack workspace";
    }
    case "todoist": {
      const r = await fetch("https://api.todoist.com/rest/v2/projects", { headers: bearer });
      if (!r.ok) throw new Error("Invalid Todoist token");
      return fallback?.trim() || "Todoist account";
    }
    case "openai": {
      const r = await fetch("https://api.openai.com/v1/models", { headers: bearer });
      if (!r.ok) throw new Error("Invalid OpenAI key");
      return fallback?.trim() || "OpenAI account";
    }
    default:
      return fallback?.trim() || "Connected account";
  }
}

/** For providers without OAuth: user pastes a personal API token. */
export const saveApiToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        provider: z.enum(TOKEN_PROVIDERS),
        token: z.string().min(8).max(500),
        label: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const label =
      data.provider === "cursor"
        ? data.label?.trim() || "Cursor account"
        : await verifyToken(data.provider, data.token, data.label);

    const { error } = await context.supabase.from("user_connections").upsert(
      {
        user_id: context.userId,
        provider: data.provider,
        access_token: data.token,
        refresh_token: null,
        expires_at: null,
        scope: null,
        account_label: label,
      },
      { onConflict: "user_id,provider" },
    );
    if (error) throw error;
    return { ok: true, label };
  });

