import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Unlumen-inspired blob card — animated SVG blob header with a rotating
 * conic-gradient glow border. Uses pure CSS animations (no JS runtime cost).
 */
export function BlobCard({
  children,
  className,
  colors = ["#ff4d8d", "#b66dff", "#4d9bff", "#7dffb4"],
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
}) {
  const id = useId().replace(/[:]/g, "");

  return (
    <div className={cn("relative rounded-3xl", className)}>
      {/* Rotating glow border */}
      <div
        aria-hidden
        className="blob-card__glow absolute -inset-[1.5px] rounded-[22px] opacity-50 blur-sm"
        style={{ background: `conic-gradient(from 0deg, ${colors.join(", ")}, ${colors[0]})` }}
      />
      <div className="relative overflow-hidden rounded-[20px] border border-border/40 bg-card">
        {/* Animated blob header */}
        <div className="blob-card__header relative h-40 overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`bg-${id}`} cx="50%" cy="40%">
                {colors.map((c, i) => (
                  <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </radialGradient>
            </defs>
            <ellipse className="blob-card__blob blob-card__blob--1" cx="120" cy="80" rx="100" ry="70" fill={`url(#bg-${id})`} opacity="0.7" />
            <ellipse className="blob-card__blob blob-card__blob--2" cx="280" cy="60" rx="90" ry="60" fill={`url(#bg-${id})`} opacity="0.5" />
            <ellipse className="blob-card__blob blob-card__blob--3" cx="200" cy="100" rx="80" ry="55" fill={`url(#bg-${id})`} opacity="0.4" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}
