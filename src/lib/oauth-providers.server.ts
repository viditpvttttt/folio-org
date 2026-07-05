// Server-only OAuth provider registry. Never import from client code.

export type ProviderId = "google" | "notion";

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string;
  extraAuthParams?: Record<string, string>;
  /** Basic-auth header for the token endpoint (Notion) */
  tokenAuthMode: "body" | "basic";
  /** Fetch a human-friendly account label after the code exchange */
  fetchAccountLabel: (accessToken: string, tokenPayload: Record<string, unknown>) => Promise<string>;
};

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  google: {
    id: "google",
    label: "Google",
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ].join(" "),
    extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    tokenAuthMode: "body",
    fetchAccountLabel: async (accessToken) => {
      const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) return "Google account";
      const j = (await r.json()) as { email?: string; name?: string };
      return j.email ?? j.name ?? "Google account";
    },
  },
  notion: {
    id: "notion",
    label: "Notion",
    clientIdEnv: "NOTION_OAUTH_CLIENT_ID",
    clientSecretEnv: "NOTION_OAUTH_CLIENT_SECRET",
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: "",
    extraAuthParams: { owner: "user", response_type: "code" },
    tokenAuthMode: "basic",
    fetchAccountLabel: async (_accessToken, payload) => {
      const p = payload as { workspace_name?: string; owner?: { user?: { name?: string } } };
      return p.workspace_name ?? p.owner?.user?.name ?? "Notion workspace";
    },
  },
};

/** Callback URL registered with each provider's OAuth app. */
export function callbackUrl(request: Request, provider: ProviderId): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}/api/public/oauth/${provider}/callback`;
}
