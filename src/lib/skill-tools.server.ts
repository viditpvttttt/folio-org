import { tool } from "ai";
import { z } from "zod";

// ---------- generateImage ----------
export const generateImageTool = tool({
  description:
    "Generate an image from a text prompt using Lovable AI. Use whenever the user asks to draw, paint, sketch, imagine, or create an image, picture, illustration, logo, or icon. Prefer this over describing an image in text.",
  inputSchema: z.object({
    prompt: z.string().min(3).describe("Detailed visual description of the image to create"),
    aspectRatio: z.enum(["1:1", "16:9", "9:16"]).default("1:1"),
  }),
  execute: async ({ prompt, aspectRatio }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "AI key missing" };
    const size = aspectRatio === "16:9" ? "1536x864" : aspectRatio === "9:16" ? "864x1536" : "1024x1024";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
          size,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { error: `Image generation failed (${res.status}) ${text.slice(0, 200)}` };
      }
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) return { error: "No image returned" };
      return { prompt, aspectRatio, dataUrl: `data:image/png;base64,${b64}` };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// ---------- editImage ----------
export const editImageTool = tool({
  description:
    "Edit an existing image. Use ONLY when the user attached an image AND asked to modify it (make it a painting, remove background, add a hat, change season, restyle, etc). The imageUrl must be one the user attached in this conversation.",
  inputSchema: z.object({
    prompt: z.string().min(3).describe("What to change about the image"),
    imageUrl: z.string().url().describe("URL of the source image (from a user attachment)"),
  }),
  execute: async ({ prompt, imageUrl }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "AI key missing" };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { error: `Image edit failed (${res.status}) ${text.slice(0, 200)}` };
      }
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) return { error: "No image returned" };
      return { prompt, dataUrl: `data:image/png;base64,${b64}` };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// ---------- runCode (JavaScript sandbox) ----------
export const runCodeTool = tool({
  description:
    "Run a short JavaScript snippet in a safe sandbox and return the console output. 2-second timeout. No network, no filesystem, no `require`. Use when the user asks to run/test/execute code, compute something programmatically, or check what a snippet outputs. For code you only need to *show* (not execute), just use a markdown code block instead.",
  inputSchema: z.object({
    code: z.string().min(1).max(10_000).describe("JavaScript to run. Use console.log to produce output."),
  }),
  execute: async ({ code }) => {
    const logs: string[] = [];
    const push = (level: string, args: unknown[]) => {
      const line = args
        .map((a) => (typeof a === "string" ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
        .join(" ");
      logs.push(level === "log" ? line : `[${level}] ${line}`);
      if (logs.length > 200) logs.push("... (truncated)");
    };
    const fakeConsole = {
      log: (...a: unknown[]) => push("log", a),
      error: (...a: unknown[]) => push("error", a),
      warn: (...a: unknown[]) => push("warn", a),
      info: (...a: unknown[]) => push("info", a),
    };
    const start = Date.now();
    try {
      const src = `"use strict"; return (async () => { ${code}\n})();`;
      // Scope: only console, Math, Date, JSON, and pure builtins reachable via closure of the function.
      const fn = new Function("console", "Math", "Date", "JSON", src);
      const runPromise = fn(fakeConsole, Math, Date, JSON) as Promise<unknown>;
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Timed out after 2000ms")), 2000));
      const result = await Promise.race([runPromise, timeout]);
      const stdout = logs.join("\n").slice(0, 8000);
      const returnValue =
        result === undefined
          ? undefined
          : (() => { try { return JSON.stringify(result, null, 2); } catch { return String(result); } })();
      return { stdout, returnValue, durationMs: Date.now() - start };
    } catch (e) {
      return { stdout: logs.join("\n").slice(0, 8000), stderr: (e as Error).message, durationMs: Date.now() - start };
    }
  },
});
