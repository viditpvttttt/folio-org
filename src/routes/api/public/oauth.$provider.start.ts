import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { PROVIDERS, callbackUrl, type ProviderId } from "@/lib/oauth-providers.server";
import { signState } from "@/lib/oauth-state.server";

export const Route = createFileRoute("/api/public/oauth/$provider/start")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const provider = params.provider as ProviderId;
        const cfg = PROVIDERS[provider];
        if (!cfg) return new Response("Unknown provider", { status: 404 });

        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) return new Response("Missing token", { status: 401 });

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) return new Response("Unauthorized", { status: 401 });

        const clientId = process.env[cfg.clientIdEnv];
        if (!clientId) {
          return new Response(
            `Missing ${cfg.clientIdEnv}. Add it in project secrets to enable ${cfg.label}.`,
            { status: 500 },
          );
        }

        const state = signState({ userId: data.user.id, provider });
        const auth = new URL(cfg.authUrl);
        auth.searchParams.set("client_id", clientId);
        auth.searchParams.set("redirect_uri", callbackUrl(request, provider));
        auth.searchParams.set("state", state);
        if (cfg.scopes) auth.searchParams.set("scope", cfg.scopes);
        if (!cfg.extraAuthParams?.response_type) auth.searchParams.set("response_type", "code");
        for (const [k, v] of Object.entries(cfg.extraAuthParams ?? {})) {
          auth.searchParams.set(k, v);
        }
        return Response.redirect(auth.toString(), 302);
      },
    },
  },
});
