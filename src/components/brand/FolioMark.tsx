import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Folio's identity mark — two stacked "leaves" of a folio: a pale page and an
 * ink-violet page. Replaces the old 3D orb everywhere.
 *
 * It is state-reactive so it can stand in for the orb in chat/voice contexts:
 *  - idle      → slow breathing float
 *  - listening → pages lift with the voice amplitude
 *  - active    → a light sweep runs across the pages ("thinking")
 *  - speaking  → alternating page bounce
 */
export function FolioMark({
  className,
  active = false,
  listening = false,
  speaking = false,
  amplitude = 0,
  glow = true,
  // physics props from the legacy orb API are accepted and ignored
  ...rest
}: {
  className?: string;
  active?: boolean;
  listening?: boolean;
  speaking?: boolean;
  amplitude?: number;
  glow?: boolean;
  [key: string]: unknown;
}) {
  const id = useId().replace(/:/g, "");
  void rest;

  const amp = Math.max(0, Math.min(1, amplitude));
  const state = listening ? "listening" : speaking ? "speaking" : active ? "thinking" : "idle";

  return (
    <div
      className={cn("relative grid aspect-square place-items-center [perspective:900px]", className)}
      data-state={state}
      style={{ ["--amp" as string]: amp.toFixed(3) }}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[8%] rounded-[30%] blur-2xl transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 60% 45%, rgba(139,124,246,0.55), rgba(181,124,246,0.28) 45%, transparent 72%)",
            opacity: 0.45 + amp * 0.5,
          }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        className="folio-mark relative h-full w-full overflow-visible"
        role="img"
        aria-label="Folio"
      >
        <defs>
          <linearGradient id={`pale-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f0ecfd" />
            <stop offset="100%" stopColor="#d9d0fb" />
          </linearGradient>
          <linearGradient id={`ink-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7d7cf7" />
            <stop offset="55%" stopColor="#9a7cf6" />
            <stop offset="100%" stopColor="#bd7cf3" />
          </linearGradient>
          <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clipL-${id}`}>
            <rect x="13" y="21" width="33" height="58" rx="11" />
          </clipPath>
          <clipPath id={`clipR-${id}`}>
            <rect x="52" y="17" width="35" height="66" rx="12" />
          </clipPath>
        </defs>

        <g className="folio-page folio-page--left">
          <rect x="13" y="21" width="33" height="58" rx="11" fill={`url(#pale-${id})`} />
          <g clipPath={`url(#clipL-${id})`}>
            <rect className="folio-sheen" x="-40" y="10" width="26" height="80" fill={`url(#sheen-${id})`} />
          </g>
        </g>

        <g className="folio-page folio-page--right">
          <rect x="52" y="17" width="35" height="66" rx="12" fill={`url(#ink-${id})`} />
          <g clipPath={`url(#clipR-${id})`}>
            <rect className="folio-sheen" x="-40" y="6" width="28" height="90" fill={`url(#sheen-${id})`} />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default FolioMark;
