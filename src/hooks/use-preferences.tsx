import { useCallback, useEffect, useState } from "react";

export type Tone = "warm" | "neutral" | "direct" | "playful";
export type Length = "brief" | "balanced" | "thorough";

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
