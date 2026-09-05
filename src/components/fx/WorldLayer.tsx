import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The 3D world every section sits inside.
 *
 * A single fixed CSS-3D stage: a receding floor and ceiling grid, side light
 * walls, and a stack of glass slabs at real Z depths. It parallaxes with the
 * pointer and dollies with scroll, so page content appears to travel through
 * the space rather than on top of a flat image. Purely planes and light —
 * no orbs, blobs or particles.
 */
export function WorldLayer({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0, cz = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      const scrolled = window.scrollY;
      const tz = Math.min(1, scrolled / Math.max(1, window.innerHeight * 2));
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      cz += (tz - cz) * 0.08;
      el.style.setProperty("--wx", cx.toFixed(4));
      el.style.setProperty("--wy", cy.toFixed(4));
      el.style.setProperty("--wz", cz.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(tick);
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className={cn("world-layer", className)}>
      <div className="world-stage">
        <div className="world-floor" />
        <div className="world-ceiling" />
        <div className="world-wall world-wall--l" />
        <div className="world-wall world-wall--r" />
        <div className="world-slabs">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="world-slab" style={{ ["--i" as string]: i }} />
          ))}
        </div>
        <div className="world-horizon" />
      </div>
      <div className="world-haze" />
    </div>
  );
}
