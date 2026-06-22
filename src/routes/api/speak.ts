import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { text, voice = "shimmer" } = (await request.json()) as { text?: string; voice?: string };
        const trimmed = (text ?? "").trim();
        if (!trimmed) return new Response("text required", { status: 400 });

        // Cap to keep latency low; UI shows text in full anyway.
        const input = trimmed.slice(0, 1200);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input,
            voice,
            instructions: "Speak warmly, calmly, with a friendly Siri-like cadence.",
            stream_format: "sse",
            response_format: "pcm",
          }),
        });

        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          return new Response(t || `TTS failed (${res.status})`, { status: res.status });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
