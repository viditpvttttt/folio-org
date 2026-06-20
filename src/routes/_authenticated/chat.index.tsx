import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createThread, listThreads } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  useEffect(() => {
    (async () => {
      const threads = await list();
      const target = threads[0] ?? (await create());
      navigate({ to: "/chat/$threadId", params: { threadId: target.id }, replace: true });
    })();
  }, [list, create, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="font-serif text-lg text-muted-foreground">Opening Folio…</div>
    </div>
  );
}
