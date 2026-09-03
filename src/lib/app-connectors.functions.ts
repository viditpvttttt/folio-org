import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { APP_CONNECTORS, APP_CONNECTOR_IDS, type AppConnectorId } from "@/lib/app-connectors";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

const idSchema = z.object({ connectorId: z.enum(APP_CONNECTOR_IDS as [AppConnectorId, ...AppConnectorId[]]) });

export type AppConnectorStatus = {
  connectorId: AppConnectorId;
  connected: boolean;
  configured: boolean;
  accountLabel: string | null;
  updatedAt: string | null;
};

export const listAppConnectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppConnectorStatus[]> => {
    const { listConnectionsForUser } = await import("@/server/appUserConnections.server");
    const rows = await listConnectionsForUser(context.userId);
    return APP_CONNECTOR_IDS.map((id) => {
      const row = rows.find((r) => r.connector_id === id);
      return {
        connectorId: id,
        connected: !!row,
        configured: !!process.env[APP_CONNECTORS[id].clientKeyEnv],
        accountLabel: row?.account_label ?? null,
        updatedAt: row?.updated_at ?? null,
      };
    });
  });

export const startAppConnectorOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const cfg = APP_CONNECTORS[data.connectorId];
    const clientAPIKey = process.env[cfg.clientKeyEnv];
    if (!clientAPIKey) {
      throw new Error(`${cfg.name} is not configured yet (${cfg.clientKeyEnv} is missing).`);
    }
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const { authorizeAppUserOAuth } = await import("@/integrations/lovable/appUserConnector");
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const existing = await getConnectionKeyForUser(context.userId, cfg.id);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: cfg.id,
      appUserId: context.userId,
      clientAPIKey,
      returnUrl,
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration: { scopes: cfg.scopes },
    });
    return { authorizationUrl };
  });

async function fetchAccountLabel(connectorId: AppConnectorId, connectionAPIKey: string) {
  const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
  const call = (path: string, init?: RequestInit) =>
    callAsAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey, connectorId, path, init });
  try {
    if (connectorId === "google_mail") {
      const r = await call("/gmail/v1/users/me/profile");
      if (!r.ok) return null;
      const j = (await r.json()) as { emailAddress?: string };
      return j.emailAddress ?? null;
    }
    if (connectorId === "github") {
      const r = await call("/user", { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) return null;
      const j = (await r.json()) as { login?: string; name?: string };
      return j.login ?? j.name ?? null;
    }
    if (connectorId === "linear") {
      const r = await call("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "query { viewer { name email } }" }),
      });
      if (!r.ok) return null;
      const j = (await r.json()) as { data?: { viewer?: { name?: string; email?: string } } };
      return j.data?.viewer?.name ?? j.data?.viewer?.email ?? null;
    }
    if (connectorId === "slack") {
      const r = await call("/api/auth.test", { method: "POST" });
      if (!r.ok) return null;
      const j = (await r.json()) as { ok?: boolean; user?: string; team?: string };
      if (!j.ok) return null;
      return [j.user, j.team].filter(Boolean).join(" · ") || null;
    }
  } catch {
    return null;
  }
  return null;
}

export const completeAppConnectorOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { exchangeAppUserOAuthCode } = await import("@/integrations/lovable/appUserConnector");
    const { saveConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, data.code);
    if (!(APP_CONNECTOR_IDS as string[]).includes(connectorId)) {
      throw new Error("OAuth completion returned an unexpected connector");
    }
    const typed = connectorId as AppConnectorId;
    const label = await fetchAccountLabel(typed, connectionAPIKey);
    await saveConnectionKeyForUser(context.userId, typed, connectionAPIKey, label);
    return { ok: true, connectorId: typed, accountLabel: label };
  });

export const disconnectAppConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const key = await getConnectionKeyForUser(context.userId, data.connectorId);
    if (key) {
      const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: data.connectorId,
        });
      } catch (e) {
        console.error("[app-connector] gateway disconnect failed", e);
      }
    }
    await deleteConnectionForUser(context.userId, data.connectorId);
    return { ok: true };
  });
