import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Magnetic hover element — pulls toward the pointer, springs back on leave. */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate3d(0,0,0)";
  };

  return (
    <As
      ref={ref as never}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform", className)}
    >
      {children}
    </As>
  );
}
