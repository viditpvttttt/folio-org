import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type FontScale = "sm" | "md" | "lg" | "xl";
export type Motion = "normal" | "reduced";
export type Contrast = "normal" | "high";

export interface A11yPrefs {
  theme: Theme;
  fontScale: FontScale;
  motion: Motion;
  contrast: Contrast;
  dyslexic: boolean;
  largeTapTargets: boolean;
}

const DEFAULTS: A11yPrefs = {
  theme: "system",
  fontScale: "md",
  motion: "normal",
  contrast: "normal",
  dyslexic: false,
  largeTapTargets: false,
};

const KEY = "folio.a11y";

interface A11yCtx extends A11yPrefs {
  update: (patch: Partial<A11yPrefs>) => void;
  reset: () => void;
}

const Ctx = createContext<A11yCtx>({ ...DEFAULTS, update: () => {}, reset: () => {} });

function applyToRoot(p: A11yPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    p.theme === "dark" ||
    (p.theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.dataset.fontScale = p.fontScale;
  root.dataset.motion = p.motion;
  root.dataset.contrast = p.contrast;
  root.dataset.dyslexic = String(p.dyslexic);
  root.dataset.tap = p.largeTapTargets ? "large" : "normal";
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const next = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
      setPrefs(next);
      applyToRoot(next);
    } catch {
      applyToRoot(DEFAULTS);
    }
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      setPrefs((cur) => {
        if (cur.theme === "system") applyToRoot(cur);
        return cur;
      });
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const update = (patch: Partial<A11yPrefs>) => {
    setPrefs((cur) => {
      const next = { ...cur, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      applyToRoot(next);
      return next;
    });
  };

  const reset = () => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setPrefs(DEFAULTS);
    applyToRoot(DEFAULTS);
  };

  return <Ctx.Provider value={{ ...prefs, update, reset }}>{children}</Ctx.Provider>;
}

export const useAccessibility = () => useContext(Ctx);
