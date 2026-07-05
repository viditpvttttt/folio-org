import { createFileRoute } from "@tanstack/react-router";
import { PROVIDERS, callbackUrl, type ProviderId } from "@/lib/oauth-providers.server";
import { verifyState } from "@/lib/oauth-state.server";

function html(status: number, body: string) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function closingPage(ok: boolean, label: string, detail?: string) {
  const title = ok ? `Connected to ${label}` : `Couldn't connect ${label}`;
  const color = ok ? "#22c55e" : "#ef4444";
  return html(
    ok ? 200 : 400,
    `<!doctype html><meta charset="utf-8"><title>${title}</title>
     <style>
       html,body{margin:0;height:100%;background:#0b0b12;color:#fff;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;text-align:center}
       .card{padding:32px 28px;border-radius:20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);max-width:380px}
       h1{font-family:'Instrument Serif',serif;font-weight:400;margin:0 0 8px;font-size:26px}
       p{opacity:.7;font-size:13px;margin:0}
       .dot{width:10px;height:10px;border-radius:999px;background:${color};display:inline-block;margin-right:8px;box-shadow:0 0 12px ${color}}
     </style>
     <div class="card">
       <h1><span class="dot"></span>${title}</h1>
       <p>${detail ?? (ok ? "You can close this window." : "You can close this window and try again.")}</p>
     </div>
     <script>
       try { if (window.opener) { window.opener.postMessage({ type: "folio-oauth", ok: ${ok}, provider: ${JSON.stringify(label)} }, "*"); } } catch(e){}
       setTimeout(() => { try { window.close(); } catch(e){} }, ${ok ? 900 : 2200});
     </script>`,
  );
}

export const Route = createFileRoute("/api/public/oauth/$provider/callback")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const provider = params.provider as ProviderId;
        const cfg = PROVIDERS[provider];
        if (!cfg) return html(404, "Unknown provider");

        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const providerError = url.searchParams.get("error");

        if (providerError) return closingPage(false, cfg.label, providerError);
        if (!code || !state) return closingPage(false, cfg.label, "Missing code/state");

        const verified = verifyState(state);
        if (!verified || verified.provider !== provider) {
          return closingPage(false, cfg.label, "Invalid state");
        }

        const clientId = process.env[cfg.clientIdEnv];
        const clientSecret = process.env[cfg.clientSecretEnv];
        if (!clientId || !clientSecret) return closingPage(false, cfg.label, "Missing OAuth credentials");

        // ---- Exchange code for tokens ----
        const form = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl(request, provider),
        });
        const headers: Record<string, string> = {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        };
        if (cfg.tokenAuthMode === "basic") {
          headers.Authorization = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        } else {
          form.set("client_id", clientId);
          form.set("client_secret", clientSecret);
        }

        const tokenRes = await fetch(cfg.tokenUrl, { method: "POST", headers, body: form.toString() });
        const tokenJson = (await tokenRes.json().catch(() => ({}))) as Record<string, unknown>;
        if (!tokenRes.ok) {
          console.error("[oauth]", provider, "token exchange failed", tokenRes.status, tokenJson);
          return closingPage(false, cfg.label, String(tokenJson.error_description ?? tokenJson.error ?? "Token exchange failed"));
        }

        const accessToken = tokenJson.access_token as string | undefined;
        const refreshToken = (tokenJson.refresh_token as string | undefined) ?? null;
        const scope = (tokenJson.scope as string | undefined) ?? cfg.scopes ?? null;
        const expiresIn = tokenJson.expires_in as number | undefined;
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
        if (!accessToken) return closingPage(false, cfg.label, "No access token returned");

        let label = cfg.label;
        try { label = await cfg.fetchAccountLabel(accessToken, tokenJson); } catch { /* ignore */ }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: upsertErr } = await supabaseAdmin.from("user_connections").upsert(
          {
            user_id: verified.userId,
            provider,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            scope,
            account_label: label,
          },
          { onConflict: "user_id,provider" },
        );
        if (upsertErr) {
          console.error("[oauth] upsert failed", upsertErr);
          return closingPage(false, cfg.label, "Could not save connection");
        }

        return closingPage(true, cfg.label);
      },
    },
  },
});
