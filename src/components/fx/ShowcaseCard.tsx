import { useRef, type ComponentType } from "react";
import { cn } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 21st.dev-inspired interactive showcase card.
 * Combines cursor-following spotlight glow, spring-smoothed 3D tilt,
 * a shimmer sweep, and a mini live-preview area — all driven by
 * pointer movement so the card reacts as the user moves across it.
 */
export function ShowcaseCard({
  title,
  desc,
  tags,
  accent = "#b66dff",
  icon: Icon,
  index,
}: {
  title: string;
  desc: string;
  tags: string[];
  accent?: string;
  icon: ComponentType<{ className?: string }>;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "group relative rounded-2xl border border-border/60 bg-card/45 backdrop-blur overflow-hidden",
        "hover:border-border transition-colors duration-300",
      )}
      style={{
        transform: "perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
        transition: "transform 0.2s ease-out",
      }}
    >
      {/* Cursor-following radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), ${hexToRgba(accent, 0.12)}, transparent 40%)`,
        }}
      />

      {/* Shimmer sweep on hover */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out"
          style={{
            background: `linear-gradient(105deg, transparent 35%, ${hexToRgba(accent, 0.08)} 50%, transparent 65%)`,
          }}
        />
      </div>

      {/* Preview area — mini live mockup */}
      <div
        className="relative h-36 overflow-hidden border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.12)}, ${hexToRgba(accent, 0.02)})` }}
      >
        <div className="absolute inset-0 p-5 flex flex-col gap-2.5">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: hexToRgba(accent, 0.7) }}>
              Live
            </span>
          </div>
          {/* Mockup text lines */}
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 rounded-full" style={{ background: hexToRgba(accent, 0.2) }} />
            <div className="h-2 w-1/2 rounded-full" style={{ background: hexToRgba(accent, 0.15) }} />
          </div>
          {/* Mockup chart bars */}
          <div className="mt-auto flex items-end gap-1.5 h-12">
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.35].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all duration-300 group-hover:!h-full"
                style={{
                  height: `${h * 100}%`,
                  background: hexToRgba(accent, 0.25 + i * 0.06),
                  transition: "height 0.3s ease-out",
                }}
              />
            ))}
          </div>
        </div>
        {/* Icon badge */}
        <div
          className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
          style={{
            background: hexToRgba(accent, 0.15),
            border: `1px solid ${hexToRgba(accent, 0.25)}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-[1] p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {String(index ?? 0).padStart(2, "0")}
          </span>
          <h3 className="font-serif text-2xl">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{desc}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
