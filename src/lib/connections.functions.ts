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

