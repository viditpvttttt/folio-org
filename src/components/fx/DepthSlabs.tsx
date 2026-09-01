import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Skiper-style layered depth: a stack of thin glass slabs in real CSS 3D,
 * parallaxed by the pointer. No spheres, no particles — just planes and light.
 */
export function DepthSlabs({
  className,
  layers = 5,
  intensity = 1,
}: {
  className?: string;
  layers?: number;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty("--px", `${cx.toFixed(4)}`);
      el.style.setProperty("--py", `${cy.toFixed(4)}`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ ["--depth-intensity" as string]: intensity }}
      className={cn("depth-slabs pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="depth-slabs__stage">
        {Array.from({ length: layers }).map((_, i) => (
          <div
            key={i}
            className="depth-slab"
            style={{
              ["--i" as string]: i,
              ["--n" as string]: layers,
            }}
          />
        ))}
      </div>
    </div>
  );
}
