import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { streamText } from "ai";

type Mode = "meeting" | "email" | "summarize" | "standup" | "onepager" | "slides";

const SYSTEMS: Record<Mode, string> = {
  meeting: `You are a chief-of-staff. Given a meeting topic, agenda, or attendees, produce a crisp briefing in markdown with:
## Objective (one sentence)
## Context (2-4 bullets)
## Talking points (numbered)
## Smart questions to ask (numbered)
## Risks & watch-outs
## Suggested next steps
Be specific, not generic. Keep it under 400 words.`,
  email: `You are an executive communications coach. Draft a professional email in the requested tone. Return markdown with:
**Subject:** ...
Then the email body.
End with 2 short alternative subject lines under "**Alt subjects:**". Be concise, warm, and clear. Match the user's tone request exactly (formal, friendly, firm, apologetic, follow-up, decline, etc.).`,
  summarize: `You are an analyst. Summarize the pasted document/notes in markdown with:
## TL;DR (1-2 sentences)
## Key points (5-8 bullets)
## Decisions made
## Action items (as a checklist with owner if mentioned, e.g. "- [ ] @alex: ...")
## Open questions
Stay faithful to the source. If information is missing, say so.`,
  standup: `You are a technical lead. Turn the user's rough bullets into a polished daily standup / weekly status in markdown with:
## Yesterday / This week
## Today / Next
## Blockers
Keep bullets short, action-verb led, and outcome-focused. If bullets are sparse, don't invent work.`,
  onepager: `You are a strategy consultant. Turn the user's idea into a one-pager in markdown with:
# Title
## Problem
## Proposal
## Why now
## Success metrics
## Risks
## Ask
Executive tone. Under 350 words.`,
  slides: `You are a presentation designer. Turn the user's topic into a slide outline in markdown. For each slide use:
### Slide N — Title
- bullet
- bullet
Speaker notes: one short sentence.
Aim for 6-10 slides.`,
};

export const Route = createFileRoute("/api/work")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mode, input } = (await request.json()) as { mode?: Mode; input?: string };
        if (!mode || !SYSTEMS[mode]) return new Response("Invalid mode", { status: 400 });
        if (!input || input.trim().length < 2) return new Response("Input required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEMS[mode],
          prompt: input.trim(),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
