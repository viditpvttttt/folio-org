import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tx", `${-y * max}deg`);
    el.style.setProperty("--ty", `${x * max}deg`);
    el.style.setProperty("--sx", `${x * 100}%`);
    el.style.setProperty("--sy", `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", `0deg`);
    el.style.setProperty("--ty", `0deg`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform: "perspective(800px) rotateX(var(--tx,0deg)) rotateY(var(--ty,0deg))", transformStyle: "preserve-3d", transition: "transform 220ms ease" }}
      className={cn("relative will-change-transform", className)}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: "radial-gradient(220px circle at calc(50% + var(--sx,0%)) calc(50% + var(--sy,0%)), rgba(255,255,255,0.18), transparent 60%)" }}
      />
      {children}
    </div>
  );
}
