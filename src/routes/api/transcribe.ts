import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const url = new URL(request.url);
        const wantStream = url.searchParams.get("stream") === "1";

        const incoming = await request.formData();
        const file = incoming.get("file");
        if (!(file instanceof File) || file.size < 512) {
          return new Response("Recording too short", { status: 400 });
        }

        const form = new FormData();
        form.append("model", "openai/gpt-4o-mini-transcribe");
        const mt = (file.type || "audio/webm").split(";")[0];
        const ext = mt === "audio/mp4" ? "mp4"
          : mt === "audio/mpeg" ? "mp3"
          : mt === "audio/wav" ? "wav"
          : "webm";
        form.append("file", file, `recording.${ext}`);
        if (wantStream) form.append("stream", "true");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return new Response(text || `Transcription failed (${res.status})`, { status: res.status });
        }

        if (wantStream && res.body) {
          return new Response(res.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        }

        const data = await res.json();
        return new Response(JSON.stringify({ text: data.text ?? "" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
