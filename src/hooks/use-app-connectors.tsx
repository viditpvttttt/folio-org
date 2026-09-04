import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listAppConnectors,
  startAppConnectorOAuth,
  completeAppConnectorOAuth,
  disconnectAppConnector,
  type AppConnectorStatus,
} from "@/lib/app-connectors.functions";
import { APP_CONNECTORS, type AppConnectorId } from "@/lib/app-connectors";
import { useAuth } from "@/hooks/use-auth";

function waitForOAuthCompletion(popup: Window, connectorId: AppConnectorId) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      ) return;
      if (event.data?.connectorId && event.data.connectorId !== connectorId) return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve(typeof event.data?.code === "string" ? event.data.code : null);
        return;
      }
      popup.close();
      reject(new Error("The connection was not completed."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The connection window closed before finishing."));
    }, 500);
  });
}

export function useAppConnectors() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listAppConnectors);
  const start = useServerFn(startAppConnectorOAuth);
  const complete = useServerFn(completeAppConnectorOAuth);
  const remove = useServerFn(disconnectAppConnector);

  const query = useQuery<AppConnectorStatus[]>({
    queryKey: ["app-connectors", user?.id],
    queryFn: () => list(),
    enabled: !!user,
  });

  const connect = useCallback(
    async (connectorId: AppConnectorId) => {
      const name = APP_CONNECTORS[connectorId].name;
      const popup = window.open("", "folio-oauth", "width=600,height=720");
      if (!popup) {
        toast.error("Popup blocked — allow popups and try again.");
        return;
      }
      try {
        const { authorizationUrl } = await start({ data: { connectorId } });
        const completion = waitForOAuthCompletion(popup, connectorId);
        popup.location.href = authorizationUrl;
        const code = await completion;
        if (code) await complete({ data: { code } });
        toast.success(`${name} connected`);
        qc.invalidateQueries({ queryKey: ["app-connectors"] });
      } catch (e) {
        popup.close();
        toast.error((e as Error).message || `Couldn't connect ${name}`);
      }
    },
    [start, complete, qc],
  );

  const disconnect = useCallback(
    async (connectorId: AppConnectorId) => {
      try {
        await remove({ data: { connectorId } });
        toast.success(`${APP_CONNECTORS[connectorId].name} disconnected`);
        qc.invalidateQueries({ queryKey: ["app-connectors"] });
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [remove, qc],
  );

  const statuses = query.data ?? [];
  const statusOf = (id: AppConnectorId) => statuses.find((s) => s.connectorId === id);

  return { statuses, statusOf, isLoading: query.isLoading, connect, disconnect };
}
