import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { streamText } from "ai";

const SYSTEM = `You are Folio's vibecoder. The user describes an app, page, widget, or effect in plain English. You reply with a SINGLE self-contained React component that will be rendered live in a sandbox.

STRICT OUTPUT RULES:
- Output ONLY a single fenced code block: \`\`\`jsx ... \`\`\`
- No prose, no headings, no explanation before or after.
- Define exactly one top-level component and end the file with: render(<ComponentName />)
- Use function components with hooks (React.useState, React.useEffect, React.useRef, etc.) — React is already in scope.
- Tailwind CSS classes are available for styling; prefer them for layout, spacing, and color.
- Do NOT use imports (no "import" statements) and no external libraries — only React + Tailwind.
- Do NOT use TypeScript syntax (no type annotations, no interfaces).
- Do NOT use fetch / external network unless the user explicitly asks. Never reference process, window.require, or Node APIs.
- Keep it self-contained: helper components, mock data, icons (inline SVG) and styles all inline.
- Make it RESPONSIVE: it may be previewed at 390px, 768px or full width. Use responsive Tailwind classes.
- Make it interactive where it makes sense: state, hover/transition, keyboard support, empty/loading states.
- Accessibility: real buttons, aria-labels on icon-only controls, sensible contrast.
- Aim for something visually delightful and production-grade — gradients, rounded corners, layered shadows, smooth transitions — not a plain wireframe.

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
        const body = (await request.json()) as {
          prompt?: string;
          previousCode?: string;
          mode?: "create" | "refine" | "fix";
          error?: string;
        };
        const prompt = body.prompt?.trim() ?? "";
        const mode = body.mode ?? "create";
        if (mode === "create" && prompt.length < 2) {
          return new Response("Prompt required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let userMessage = prompt;
        if (mode === "refine" && body.previousCode) {
          userMessage = `Here is the current component:\n\n\`\`\`jsx\n${body.previousCode}\n\`\`\`\n\nApply this change and return the FULL updated component:\n${prompt}`;
        } else if (mode === "fix" && body.previousCode) {
          userMessage = `This component fails to render in the sandbox.\n\n\`\`\`jsx\n${body.previousCode}\n\`\`\`\n\nRuntime/compile error:\n${body.error ?? "unknown error"}\n\nReturn the FULL corrected component. Keep the design intent identical, just make it run.`;
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM,
          prompt: userMessage,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
