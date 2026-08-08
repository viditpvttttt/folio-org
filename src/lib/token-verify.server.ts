import type { TokenProvider } from "@/lib/token-providers";

/** Verify a personal API token and return a human-readable account label. */
export async function verifyToken(
  provider: TokenProvider,
  token: string,
  fallback?: string,
): Promise<string> {
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
    case "cursor":
    default:
      return fallback?.trim() || "Connected account";
  }
}
