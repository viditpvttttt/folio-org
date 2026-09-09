import { useRef, type ReactNode, type ComponentType } from "react";
import { cn } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type BentoSize = "large" | "wide" | "tall" | "small";

const SPAN: Record<BentoSize, string> = {
  large: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2",
  tall: "md:row-span-2",
  small: "",
};

export interface BentoItem {
  size?: BentoSize;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  accent?: string;
  visual?: ReactNode;
}

/**
 * Apple-inspired premium bento card — glassmorphism surface with
 * cursor-following spotlight, gradient accent line, and spring hover.
 */
export function BentoCard({ item }: { item: BentoItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = item.accent ?? "#b66dff";
  const Icon = item.icon;
  const size = item.size ?? "small";

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group relative rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden",
        "transition-all duration-500 hover:border-border/80 hover:bg-card/40 hover:shadow-2xl hover:shadow-foreground/5",
        SPAN[size],
      )}
    >
      {/* Cursor spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), ${hexToRgba(accent, 0.08)}, transparent 50%)`,
        }}
      />
      {/* Top accent line on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <div className="relative z-[1] h-full p-7 flex flex-col">
        {/* Icon */}
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
          style={{
            background: hexToRgba(accent, 0.1),
            border: `1px solid ${hexToRgba(accent, 0.2)}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>

        {/* Content */}
        <h3 className="font-serif text-xl md:text-2xl tracking-tight mt-5 mb-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>

        {/* Optional visual */}
        {item.visual && <div className="mt-auto pt-5">{item.visual}</div>}
      </div>
    </div>
  );
}

export function BentoGrid({ items, className }: { items: BentoItem[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]", className)}>
      {items.map((item, i) => (
        <BentoCard key={i} item={item} />
      ))}
    </div>
  );
}
