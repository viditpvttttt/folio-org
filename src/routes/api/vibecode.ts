import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { streamText } from "ai";

const SYSTEM = `You are Folio's vibecoder. The user describes an app, page, widget, or effect in plain English. You reply with a SINGLE self-contained React component that will be rendered live in a sandbox.

STRICT OUTPUT RULES:
- Output ONLY a single fenced code block: \`\`\`jsx ... \`\`\`
- No prose, no headings, no explanation before or after.
- Define exactly one component and end the file with: render(<ComponentName />)
- Use function components with hooks (React.useState, React.useEffect, etc.) — React is already in scope.
- Tailwind CSS classes are available for styling; prefer them for layout, spacing, and color.
- Do NOT use imports (no "import" statements) — assume React is in scope.
- Do NOT use TypeScript syntax (no type annotations, no interfaces).
- Do NOT use fetch / external network unless the user explicitly asks.
- Keep the component self-contained: any helper components, data, styles inline.
- Use vibrant, modern styling: gradients, rounded corners, subtle shadows, smooth transitions.
- Aim for something visually delightful, not a plain wireframe.

EXAMPLE OUTPUT (respond in exactly this shape):
\`\`\`jsx
function Counter() {
  const [n, setN] = React.useState(0);
  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white text-center shadow-xl">
      <div className="text-6xl font-bold tabular-nums">{n}</div>
      <button onClick={() => setN(n + 1)} className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition">
        +1
      </button>
    </div>
  );
}
render(<Counter />)
\`\`\``;

export const Route = createFileRoute("/api/vibecode")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || prompt.trim().length < 2) {
          return new Response("Prompt required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM,
          prompt: prompt.trim(),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
