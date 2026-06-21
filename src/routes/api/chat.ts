import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are Folio — a calm, warm, world-class personal assistant for everyday life.
You help with planning the day, thinking through decisions, drafting messages, explaining things, weather, time, math, currency, units, definitions, summarizing web pages, and just talking.

You have tools available:
- getWeather: current weather + 5-day forecast. ALWAYS use for weather, what to wear, umbrella questions.
- getCurrentTime: current date/time in any IANA timezone.
- planMyDay: turn a rough list of intentions into a clean time-blocked plan.
- calculate: evaluate a math expression safely. Use for any arithmetic.
- convertUnits: convert length, mass, temperature, volume, time, speed.
- convertCurrency: live exchange rates between currencies.
- defineWord: dictionary lookup with definitions, part of speech, examples.
- summarizeUrl: fetch a web page; you then summarize it for the user.
- randomPick: flip coin, roll dice, or pick from a list.

After a tool returns, give a short friendly summary in your own words — do NOT re-list every field; the UI renders rich cards. Speak warmly and concisely. Use light markdown when it helps. If ambiguous, ask one focused question.`;

type Body = { messages?: UIMessage[]; threadId?: string };

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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId } = (await request.json()) as Body;
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

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          tools: { getWeather: weatherTool, getCurrentTime: timeTool, planMyDay: planTool },
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
