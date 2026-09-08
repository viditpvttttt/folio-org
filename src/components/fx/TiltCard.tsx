import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-tracked 3D tilt wrapper — a lighter cousin of SpotlightCard without
 * the glow, for arbitrary content (code panels, marks, figures). Tilts and
 * lifts toward the cursor, eases back to rest on leave. Disabled when the
 * global depth setting is "flat" (see `.tilt-card` rules in styles.css).
 */
export function TiltCard({
  children,
  className,
  lift = 10,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * (lift * 0.4)}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * (lift * 0.4)}deg`);
    el.style.setProperty("--tz", `${lift}px`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--tz", "0px");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("tilt-card", className)}
    >
      {children}
    </div>
  );
}
