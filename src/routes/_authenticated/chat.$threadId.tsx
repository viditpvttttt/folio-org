import { createFileRoute } from "@tanstack/react-router";
import { ChatRoom } from "@/components/chat/ChatRoom";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  return <ChatRoom key={threadId} threadId={threadId} />;
}
