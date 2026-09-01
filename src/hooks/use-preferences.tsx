import { useCallback, useEffect, useState } from "react";

export type Tone = "warm" | "neutral" | "direct" | "playful";
export type Length = "brief" | "balanced" | "thorough";
export type Units = "metric" | "imperial";
export type TimeFormat = "12h" | "24h";
export type Density = "comfortable" | "compact";
export type Landing = "dashboard" | "chat";
export type Depth = "flat" | "soft" | "deep";

/** Widgets the dashboard can show, in render order. */
export const DASHBOARD_WIDGETS = [
  { id: "stats", label: "Live stats" },
  { id: "actions", label: "Quick actions" },
  { id: "skills", label: "Skills" },
  { id: "weather", label: "Weather & news" },
  { id: "memory", label: "Memory" },
  { id: "recent", label: "Recent chats" },
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];


export type Preferences = {
  /** How Folio should sound. */
  tone: Tone;
  /** How much Folio should write. */
  length: Length;
  /** Nickname Folio uses when addressing you. */
  nickname: string;
  /** Speak replies out loud by default. */
  autoSpeak: boolean;
  /** Playback rate for spoken replies. */
  speechRate: number;
  /** Send with Enter (off = Enter makes a newline). */
  enterToSend: boolean;
  /** Show suggested prompts on an empty conversation. */
  showSuggestions: boolean;
  /** Let Folio use your location for weather and commute answers. */
  shareLocation: boolean;
  /** Let Folio remember facts about you between conversations. */
  allowMemory: boolean;
  /** Measurement system used in answers and widgets. */
  units: Units;
  /** Clock format across the app. */
  timeFormat: TimeFormat;
  /** Transcript spacing. */
  density: Density;
  /** Show a timestamp under each message. */
  showTimestamps: boolean;
  /** Default news topic for widgets. */
  newsTopic: string;
  /** Where Folio opens after sign-in. */
  landing: Landing;
  /** Show the weather + news rail in chat. */
  showRail: boolean;
  /** Preferred reply language ("auto" follows your message). */
  language: string;
  /** Global 3D depth level, applied to every section. */
  depth: Depth;
  /** Dashboard widgets that are visible, in order. */
  widgets: WidgetId[];
  /** Active quick filter on the dashboard tool grids. */
  quickFilter: string;
};

export const DEFAULT_PREFERENCES: Preferences = {
  tone: "warm",
  length: "balanced",
  nickname: "",
  autoSpeak: false,
  speechRate: 1,
  enterToSend: true,
  showSuggestions: true,
  shareLocation: true,
  allowMemory: true,
  units: "metric",
  timeFormat: "12h",
  density: "comfortable",
  showTimestamps: false,
  newsTopic: "technology",
  landing: "dashboard",
  showRail: true,
  language: "auto",
  depth: "soft",
  widgets: DASHBOARD_WIDGETS.map((w) => w.id),
  quickFilter: "all",
};



const KEY = "folio.preferences";

function read(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/** Local, per-browser assistant preferences. */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPrefs(read());
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  return { ...prefs, update, reset };
}
