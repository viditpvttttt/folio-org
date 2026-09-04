import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/return")({
  component: OAuthReturn,
  head: () => ({
    meta: [
      { title: "Finishing connection · Folio" },
      { name: "description", content: "Completing your account connection with Folio." },
    ],
  }),
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectorId = params.get("connector_id") ?? "";
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string | null,
    ) => {
      window.opener?.postMessage(
        { type, connectorId, code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "The connection was cancelled.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("Consent finished without an exchange code.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="rounded-2xl border border-border/60 bg-card/60 px-8 py-10 backdrop-blur">
        <p className="font-serif text-2xl">Folio</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
