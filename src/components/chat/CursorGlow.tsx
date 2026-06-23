import { useEffect, useRef } from "react";

/**
 * A soft, mouse-following radial glow that floats over the background.
 * Pointer-events disabled so it never blocks interaction.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x - 240}px, ${pos.current.y - 240}px, 0)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 h-[480px] w-[480px] -z-[5] will-change-transform"
      style={{
        background:
          "radial-gradient(closest-side, rgba(255,77,141,0.22), rgba(125,255,180,0.10) 35%, rgba(77,155,255,0.10) 55%, transparent 72%)",
        filter: "blur(20px)",
        mixBlendMode: "screen",
      }}
    />
  );
}
