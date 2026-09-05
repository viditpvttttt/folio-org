import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  gmailListTool, gmailSendTool, gmailReadTool,
  notionSearchTool, vercelProjectsTool, cursorStatusTool,
} from "@/lib/connector-tools.server";
import { generateImageTool, editImageTool, runCodeTool } from "@/lib/skill-tools.server";
import { deepResearchTool } from "@/lib/research-tools.server";

const SYSTEM_PROMPT = `You are Folio — a calm, warm, world-class personal assistant for everyday life.
You help with planning the day, thinking through decisions, drafting messages, explaining things, weather, time, math, currency, units, definitions, summarizing web pages, understanding photos and documents the user attaches, and just talking.

You have tools available:
- getWeather, getCurrentTime, planMyDay, calculate, convertUnits, convertCurrency, defineWord.
- getNews, translateText, generatePassword, generateQrCode, getRecipe, getColorPalette, getJoke.
- summarizeUrl, randomPick.
- generateImage: create an image from a text prompt. Call this whenever the user asks to draw, paint, make an image, sketch, illustrate, or design something visual. After it returns, give a one-line friendly caption — the UI already shows the image.
- editImage: edit an image the user attached earlier in this conversation. Pass its URL as imageUrl. Only call when there is a real attachment.
- runCode: run a short JavaScript snippet in a safe sandbox and get the console output. Call this when the user asks to run/test/execute code or wants to see what a snippet outputs. Do NOT call it just to show code — for code you only need to display, use a triple-backtick markdown block.
- deepResearch: search the LIVE web and read top results. Use whenever the answer depends on recent info (latest library docs, current events, prices, releases) or when the user asks you to "look it up", "research", "browse", or "find the latest". Cite the URLs you used.
- rememberFact: save a durable fact about the user (name, city, preferences, goals, allergies, work). Use it QUIETLY whenever the user shares something worth remembering long-term. When the user describes their PROJECT STACK (languages, frameworks, conventions, file structure, coding style), save it with kind:"stack" so you can tailor future code suggestions. Never save secrets, one-time trivia, or things the user asked you to forget.
- Connected accounts (only work if the user connected them at /connectors):
  - gmailListMessages, gmailReadMessage, gmailSendMessage — Gmail. ALWAYS repeat the recipient/subject and ask the user to confirm before calling gmailSendMessage.
  - notionSearch — search the user's Notion workspace.
  - vercelListProjects — list the user's Vercel projects.
  - cursorStatus — check Cursor account status.
  If a connector tool returns notConnected:true, tell the user to open the Connectors page and tap Connect.

For code answers, always use fenced markdown code blocks with the language tag (\`\`\`ts, \`\`\`python, \`\`\`bash, etc). Explain concisely, then show the code. When the user has told you their project stack (see memory), MATCH IT — same language, framework, conventions, and file layout.

Visual reasoning: when the user attaches a UI mockup, wireframe, napkin sketch, or screenshot and asks you to "build", "code", "recreate", or "turn this into a component", carefully study the image and output a complete, self-contained React + Tailwind component in a \`\`\`tsx code block. Match the layout, spacing, hierarchy, and text you can see. Prefer semantic HTML and accessible defaults.

When the user attaches a photo or document, read it carefully and describe or answer their question about it.
After a tool returns, give a short friendly summary in your own words — do NOT re-list every field; the UI renders rich cards. Speak warmly and concisely. Use light markdown when it helps. If ambiguous, ask one focused question.`;

type ChatPrefs = {
  tone?: string;
  length?: string;
  nickname?: string;
  units?: "metric" | "imperial";
  timeFormat?: "12h" | "24h";
  language?: string;
};
type Body = { messages?: UIMessage[]; threadId?: string; prefs?: ChatPrefs };

/** Turn the user's saved settings into a short system-prompt block. */
function prefsBlock(p?: ChatPrefs): string {
  if (!p) return "";
  const lines: string[] = [];
  if (p.nickname?.trim()) lines.push(`Address the user as "${p.nickname.trim()}".`);
  if (p.tone) lines.push(`Tone: ${p.tone}.`);
  if (p.length) {
    const map: Record<string, string> = {
      brief: "Keep answers short — a couple of sentences unless asked for more.",
      balanced: "Keep answers a balanced length.",
      thorough: "Answers may be thorough and detailed.",
    };
    lines.push(map[p.length] ?? "");
  }
  if (p.units) {
    lines.push(
      p.units === "imperial"
        ? "Use imperial units (°F, miles, pounds) in answers and when calling weather tools."
        : "Use metric units (°C, kilometres, kilograms) in answers and when calling weather tools.",
    );
  }
  if (p.timeFormat) lines.push(`Write times in ${p.timeFormat === "24h" ? "24-hour" : "12-hour am/pm"} format.`);
  if (p.language && p.language !== "auto") {
    lines.push(`Always reply in ${p.language}, regardless of the language of the question.`);
  }
  const body = lines.filter(Boolean).join("\n- ");
  return body ? `\n\nUser preferences (follow these):\n- ${body}` : "";
}

const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Heavy showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
};
const describe = (c: number) => WMO[c] ?? "Unknown";

const weatherTool = tool({
  description: "Get current weather conditions and a 5-day forecast for a city or place.",
  inputSchema: z.object({
    location: z.string().describe("City name, e.g. 'Tokyo' or 'Paris, France'"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  execute: async ({ location, units }) => {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`,
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) return { error: `Couldn't find "${location}".` };

    const tempUnit = units === "fahrenheit" ? "fahrenheit" : "celsius";
    const windUnit = units === "fahrenheit" ? "mph" : "kmh";
    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=5`,
    );
    const w = await wRes.json();
    const cur = w.current;
    const daily = (w.daily?.time ?? []).map((date: string, i: number) => ({
      date,
      max: w.daily.temperature_2m_max[i],
      min: w.daily.temperature_2m_min[i],
      code: w.daily.weather_code[i],
      description: describe(w.daily.weather_code[i]),
    }));

    return {
      location: place.name,
      country: place.country,
      temperature: cur.temperature_2m,
      apparent: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      windSpeed: cur.wind_speed_10m,
      weatherCode: cur.weather_code,
      isDay: cur.is_day,
      description: describe(cur.weather_code),
      daily,
      units: { temp: tempUnit === "celsius" ? "°C" : "°F", wind: windUnit },
    };
  },
});

const timeTool = tool({
  description: "Get the current date and time in any IANA timezone.",
  inputSchema: z.object({
    timezone: z.string().describe("IANA timezone like 'America/New_York' or 'Asia/Tokyo'"),
  }),
  execute: async ({ timezone }) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone, weekday: "long", year: "numeric", month: "long",
        day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });
      return { timezone, formatted: formatter.format(now), iso: now.toISOString() };
    } catch {
      return { error: `Unknown timezone: ${timezone}` };
    }
  },
});

const planTool = tool({
  description: "Build a clean time-blocked plan from a list of tasks/intentions.",
  inputSchema: z.object({
    startTime: z.string().describe("Start time like '09:00'").default("09:00"),
    tasks: z.array(z.object({
      title: z.string(),
      minutes: z.number().int().min(5).max(480).default(30),
    })).min(1),
  }),
  execute: async ({ startTime, tasks }) => {
    const [h, m] = startTime.split(":").map(Number);
    let cursor = (h || 9) * 60 + (m || 0);
    const blocks = tasks.map((t) => {
      const start = cursor;
      cursor += t.minutes;
      const fmt = (mins: number) =>
        `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
      return { title: t.title, start: fmt(start), end: fmt(cursor), minutes: t.minutes };
    });
    return { blocks, totalMinutes: blocks.reduce((a, b) => a + b.minutes, 0) };
  },
});

// -------- calculate --------
const calcTool = tool({
  description: "Safely evaluate an arithmetic expression. Supports + - * / % ** parentheses and Math functions (sqrt, sin, cos, log, etc).",
  inputSchema: z.object({ expression: z.string() }),
  execute: async ({ expression }) => {
    if (!/^[\d\s+\-*/%().,eE^a-zA-Z_]*$/.test(expression)) {
      return { error: "Invalid characters in expression" };
    }
    try {
      const safe = expression.replace(/\^/g, "**");
      // eslint-disable-next-line no-new-func
      const fn = new Function("Math", `"use strict"; return (${safe});`);
      const result = fn(Math);
      if (typeof result !== "number" || !isFinite(result)) return { error: "Result is not a finite number" };
      return { expression, result };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// -------- convertUnits --------
const UNIT_FACTORS: Record<string, { base: string; toBase: (v: number) => number; fromBase: (v: number) => number }> = {
  // length -> meter
  mm: { base: "length", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  cm: { base: "length", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  m: { base: "length", toBase: (v) => v, fromBase: (v) => v },
  km: { base: "length", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  in: { base: "length", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  ft: { base: "length", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  yd: { base: "length", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  mi: { base: "length", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  // mass -> kg
  mg: { base: "mass", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
  g: { base: "mass", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  kg: { base: "mass", toBase: (v) => v, fromBase: (v) => v },
  lb: { base: "mass", toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
  oz: { base: "mass", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  // volume -> liter
  ml: { base: "volume", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  l: { base: "volume", toBase: (v) => v, fromBase: (v) => v },
  gal: { base: "volume", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
  cup: { base: "volume", toBase: (v) => v * 0.24, fromBase: (v) => v / 0.24 },
  // time -> seconds
  s: { base: "time", toBase: (v) => v, fromBase: (v) => v },
  min: { base: "time", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
  h: { base: "time", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
  day: { base: "time", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
  // speed -> m/s
  "m/s": { base: "speed", toBase: (v) => v, fromBase: (v) => v },
  "km/h": { base: "speed", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
  mph: { base: "speed", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
  knot: { base: "speed", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
};

const convertTool = tool({
  description: "Convert between units (length, mass, volume, time, speed, temperature). For temperature use 'c', 'f', or 'k'.",
  inputSchema: z.object({
    value: z.number(),
    from: z.string().describe("Unit, e.g. 'km', 'lb', 'c', 'mph'"),
    to: z.string().describe("Unit to convert to"),
  }),
  execute: async ({ value, from, to }) => {
    const f = from.toLowerCase().trim();
    const t = to.toLowerCase().trim();
    // temperature special-case
    const temp = ["c", "f", "k"];
    if (temp.includes(f) && temp.includes(t)) {
      const toC = f === "c" ? value : f === "f" ? (value - 32) * (5 / 9) : value - 273.15;
      const out = t === "c" ? toC : t === "f" ? toC * (9 / 5) + 32 : toC + 273.15;
      return { value, from: f, to: t, result: Number(out.toFixed(4)) };
    }
    const fu = UNIT_FACTORS[f];
    const tu = UNIT_FACTORS[t];
    if (!fu || !tu) return { error: `Unknown unit. Supported: ${Object.keys(UNIT_FACTORS).join(", ")}, c/f/k` };
    if (fu.base !== tu.base) return { error: `Cannot convert ${fu.base} to ${tu.base}` };
    const result = tu.fromBase(fu.toBase(value));
    return { value, from: f, to: t, result: Number(result.toFixed(6)) };
  },
});

// -------- convertCurrency --------
const currencyTool = tool({
  description: "Convert between currencies using live exchange rates.",
  inputSchema: z.object({
    amount: z.number().default(1),
    from: z.string().describe("3-letter code like 'USD'"),
    to: z.string().describe("3-letter code like 'EUR'"),
  }),
  execute: async ({ amount, from, to }) => {
    try {
      const f = from.toUpperCase();
      const t = to.toUpperCase();
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${f}&symbols=${t}`);
      if (!res.ok) return { error: `Rate lookup failed (${res.status})` };
      const data = await res.json();
      const rate = data?.rates?.[t];
      if (!rate) return { error: `No rate for ${f} -> ${t}` };
      return { amount, from: f, to: t, rate, result: Number((amount * rate).toFixed(4)), date: data.date };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// -------- defineWord --------
const defineTool = tool({
  description: "Look up a word's definition, part of speech, and examples.",
  inputSchema: z.object({ word: z.string() }),
  execute: async ({ word }) => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return { error: `No definition found for "${word}"` };
      const data = await res.json();
      const entry = data?.[0];
      if (!entry) return { error: `No definition found for "${word}"` };
      const meanings = (entry.meanings ?? []).slice(0, 3).map((m: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }) => ({
        partOfSpeech: m.partOfSpeech,
        definitions: (m.definitions ?? []).slice(0, 2).map((d) => ({
          definition: d.definition,
          example: d.example,
        })),
      }));
      const phonetic = entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text;
      return { word: entry.word, phonetic, meanings };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// -------- summarizeUrl --------
const summarizeUrlTool = tool({
  description: "Fetch the readable text of a web page so the assistant can summarize it.",
  inputSchema: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: { "X-Return-Format": "markdown" },
      });
      if (!res.ok) return { error: `Could not fetch (${res.status})` };
      const text = await res.text();
      const trimmed = text.slice(0, 8000);
      return { url, contentLength: text.length, content: trimmed };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
});

// -------- randomPick --------
const randomTool = tool({
  description: "Random helper: flip a coin, roll dice, or pick from a list.",
  inputSchema: z.object({
    mode: z.enum(["coin", "dice", "pick"]),
    sides: z.number().int().min(2).max(1000).optional().describe("Dice sides (default 6)"),
    count: z.number().int().min(1).max(20).optional().describe("Number of dice or picks (default 1)"),
    choices: z.array(z.string()).optional().describe("Required for 'pick'"),
  }),
  execute: async ({ mode, sides = 6, count = 1, choices }) => {
    if (mode === "coin") {
      const flips = Array.from({ length: count }, () => (Math.random() < 0.5 ? "Heads" : "Tails"));
      return { mode, results: flips };
    }
    if (mode === "dice") {
      const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
      return { mode, sides, results: rolls, total: rolls.reduce((a, b) => a + b, 0) };
    }
    if (!choices || choices.length === 0) return { error: "choices required" };
    const picks = Array.from({ length: count }, () => choices[Math.floor(Math.random() * choices.length)]);
    return { mode, results: picks };
  },
});

// -------- getNews --------
const newsTool = tool({
  description: "Get top trending news headlines (tech-leaning, from Hacker News).",
  inputSchema: z.object({
    topic: z.string().optional().describe("Optional topic filter, e.g. 'AI'"),
    limit: z.number().int().min(1).max(10).default(6),
  }),
  execute: async ({ topic, limit = 6 }) => {
    try {
      const q = topic
        ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=${limit}`
        : `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
      const res = await fetch(q);
      if (!res.ok) return { error: `News lookup failed (${res.status})` };
      const data = await res.json();
      const items = (data.hits ?? []).slice(0, limit).map((h: { title?: string; url?: string; points?: number; author?: string; objectID: string }) => ({
        title: h.title ?? "(untitled)",
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        points: h.points ?? 0,
        author: h.author ?? "",
      }));
      return { topic: topic ?? "trending", items };
    } catch (e) { return { error: (e as Error).message }; }
  },
});

// -------- translateText --------
const translateTool = tool({
  description: "Translate text between languages. Use ISO codes like 'en', 'es', 'fr', 'ja'.",
  inputSchema: z.object({
    text: z.string().min(1),
    from: z.string().default("auto"),
    to: z.string().describe("Target language code like 'es', 'fr', 'ja'"),
  }),
  execute: async ({ text, from = "auto", to }) => {
    try {
      const pair = `${from === "auto" ? "autodetect" : from}|${to}`;
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`,
      );
      if (!res.ok) return { error: `Translate failed (${res.status})` };
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (!translated) return { error: "No translation returned" };
      return { source: text, from, to, translated };
    } catch (e) { return { error: (e as Error).message }; }
  },
});

// -------- generatePassword --------
const passwordTool = tool({
  description: "Generate a cryptographically strong password.",
  inputSchema: z.object({
    length: z.number().int().min(8).max(128).default(20),
    symbols: z.boolean().default(true),
    numbers: z.boolean().default(true),
  }),
  execute: async ({ length = 20, symbols = true, numbers = true }) => {
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const nums = "23456789";
    const syms = "!@#$%^&*()-_=+[]{};:,.?";
    let alphabet = lower + upper;
    if (numbers) alphabet += nums;
    if (symbols) alphabet += syms;
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    const strength = length >= 20 ? "very strong" : length >= 14 ? "strong" : length >= 10 ? "ok" : "weak";
    return { password, length, strength };
  },
});

// -------- generateQrCode --------
const qrTool = tool({
  description: "Generate a QR code image URL for any text, link, wifi string, or contact.",
  inputSchema: z.object({
    content: z.string().min(1).describe("Text or URL to encode"),
    size: z.number().int().min(120).max(800).default(280),
  }),
  execute: async ({ content, size = 280 }) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}`;
    return { content, size, imageUrl: url };
  },
});

// -------- getRecipe --------
const recipeTool = tool({
  description: "Get a recipe — random by default, or search by dish name.",
  inputSchema: z.object({
    query: z.string().optional().describe("Optional dish name to search for"),
  }),
  execute: async ({ query }) => {
    try {
      const endpoint = query
        ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
        : `https://www.themealdb.com/api/json/v1/1/random.php`;
      const res = await fetch(endpoint);
      if (!res.ok) return { error: `Recipe lookup failed (${res.status})` };
      const data = await res.json();
      const meal = data?.meals?.[0];
      if (!meal) return { error: `No recipe found${query ? ` for "${query}"` : ""}` };
      const ingredients: { name: string; measure: string }[] = [];
      for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (name && name.trim()) ingredients.push({ name: name.trim(), measure: (measure ?? "").trim() });
      }
      return {
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
        image: meal.strMealThumb,
        instructions: (meal.strInstructions ?? "").slice(0, 1200),
        ingredients,
        source: meal.strSource || meal.strYoutube || null,
      };
    } catch (e) { return { error: (e as Error).message }; }
  },
});

// -------- getColorPalette --------
const paletteTool = tool({
  description: "Generate a 5-color harmonious palette from a base hex color or named theme (e.g. 'sunset', 'forest').",
  inputSchema: z.object({
    base: z.string().describe("Hex like '#3b82f6' or a mood word like 'sunset'"),
  }),
  execute: async ({ base }) => {
    const moods: Record<string, string> = {
      sunset: "#ff6b6b", forest: "#2f855a", ocean: "#1e6091", lavender: "#9b8cce",
      sand: "#d4a373", mono: "#3a3a3a", neon: "#ff00aa", paper: "#f4ecd8",
    };
    let hex = base.trim().toLowerCase();
    if (!hex.startsWith("#")) hex = moods[hex] ?? `#${hex}`;
    if (!/^#[0-9a-f]{6}$/.test(hex)) return { error: "Provide a hex like #3b82f6 or a mood word." };
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // RGB -> HSL
    const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
    let h = 0; const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d !== 0) {
      const rr = r / 255, gg = g / 255, bb = b / 255;
      if (max === rr) h = ((gg - bb) / d) % 6;
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    const hsl2hex = (H: number, S: number, L: number) => {
      const C = (1 - Math.abs(2 * L - 1)) * S;
      const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
      const m = L - C / 2;
      let [rr, gg, bb] = [0, 0, 0];
      if (H < 60) [rr, gg, bb] = [C, X, 0];
      else if (H < 120) [rr, gg, bb] = [X, C, 0];
      else if (H < 180) [rr, gg, bb] = [0, C, X];
      else if (H < 240) [rr, gg, bb] = [0, X, C];
      else if (H < 300) [rr, gg, bb] = [X, 0, C];
      else [rr, gg, bb] = [C, 0, X];
      const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
      return `#${to(rr)}${to(gg)}${to(bb)}`;
    };
    const colors = [
      hsl2hex((h + 0) % 360, Math.min(1, s + 0.05), Math.max(0.15, l - 0.25)),
      hsl2hex((h + 0) % 360, s, Math.max(0.25, l - 0.1)),
      hex,
      hsl2hex((h + 30) % 360, Math.min(1, s), Math.min(0.85, l + 0.12)),
      hsl2hex((h + 180) % 360, Math.min(1, s * 0.8), Math.min(0.9, l + 0.18)),
    ];
    return { base: hex, colors };
  },
});

// -------- getJoke --------
const jokeTool = tool({
  description: "Get a clean dad joke.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const res = await fetch("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
      if (!res.ok) return { error: `Joke lookup failed (${res.status})` };
      const data = await res.json();
      return { joke: data.joke as string };
    } catch (e) { return { error: (e as Error).message }; }
  },
});

// -------- rememberFact factory (needs per-request supabase + userId) --------
function makeRememberTool(sb: ReturnType<typeof createClient<Database>>, userId: string) {
  return tool({
    description: "Save a durable, useful fact about the user (name, city, preferences, allergies, work, goals). Keep it short.",
    inputSchema: z.object({
      content: z.string().min(2).max(300).describe("The fact to remember, in first person e.g. 'Prefers metric units'."),
      kind: z.enum(["fact", "preference", "goal", "profile"]).default("fact"),
    }),
    execute: async ({ content, kind }) => {
      const { error } = await sb.from("user_memories").insert({ user_id: userId, content, kind });
      if (error) return { error: error.message };
      return { saved: true, content, kind };
    },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId, prefs } = (await request.json()) as Body;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("messages and threadId required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );
        const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const userId = userRes.user.id;

        const { data: thread, error: threadErr } = await supabase
          .from("threads").select("id").eq("id", threadId).maybeSingle();
        if (threadErr || !thread) return new Response("Thread not found", { status: 404 });

        const { data: mems } = await supabase
          .from("user_memories").select("content,kind").order("created_at", { ascending: false }).limit(50);
        const stacks = (mems ?? []).filter((m) => m.kind === "stack");
        const facts = (mems ?? []).filter((m) => m.kind !== "stack");
        const stackBlock = stacks.length
          ? `\n\nUser's project stack (match this style when writing code — languages, frameworks, conventions, file layout):\n${stacks.map((s) => `- ${s.content}`).join("\n")}`
          : "";
        const memoryBlock = facts.length
          ? `\n\nKnown facts about the user (contextual memory — use naturally when relevant, do not recite):\n${facts.map((m) => `- (${m.kind}) ${m.content}`).join("\n")}`
          : "";

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT + prefsBlock(prefs) + stackBlock + memoryBlock,
          messages: await convertToModelMessages(messages),
          tools: {
            getWeather: weatherTool,
            getCurrentTime: timeTool,
            planMyDay: planTool,
            calculate: calcTool,
            convertUnits: convertTool,
            convertCurrency: currencyTool,
            defineWord: defineTool,
            summarizeUrl: summarizeUrlTool,
            randomPick: randomTool,
            getNews: newsTool,
            translateText: translateTool,
            generatePassword: passwordTool,
            generateQrCode: qrTool,
            getRecipe: recipeTool,
            getColorPalette: paletteTool,
            getJoke: jokeTool,
            rememberFact: makeRememberTool(supabase, userId),
            generateImage: generateImageTool,
            editImage: editImageTool,
            runCode: runCodeTool,
            deepResearch: deepResearchTool,
            gmailListMessages: gmailListTool(supabase),
            gmailReadMessage: gmailReadTool(supabase),
            gmailSendMessage: gmailSendTool(supabase),
            notionSearch: notionSearchTool(supabase),
            vercelListProjects: vercelProjectsTool(supabase),
            cursorStatus: cursorStatusTool(supabase),
          },
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              const last = finalMessages[finalMessages.length - 1];
              const userMsg = [...finalMessages].reverse().find((m) => m.role === "user");
              if (userMsg) {
                await supabase.from("messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: userMsg.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
                });
              }
              if (last && last.role === "assistant") {
                await supabase.from("messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: last.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
                });
              }
              await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
              if (userMsg) {
                const { data: existing } = await supabase
                  .from("threads").select("title").eq("id", threadId).maybeSingle();
                if (existing && (existing.title === "New chat" || !existing.title)) {
                  const text = userMsg.parts
                    .map((p) => (p.type === "text" ? p.text : ""))
                    .join(" ").trim().slice(0, 60);
                  if (text) await supabase.from("threads").update({ title: text }).eq("id", threadId);
                }
              }
            } catch (e) {
              console.error("persist messages failed", e);
            }
          },
        });
      },
    },
  },
});
