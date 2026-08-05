import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Antigravity particle field.
 *
 * Behaviour modelled on Google Antigravity's ambient hero field:
 *  - every particle has negative gravity (buoyancy) so the field drifts upward
 *  - three parallax depth layers with different speed / size / opacity
 *  - the cursor is a gravity well: nearby particles are pushed outward and
 *    given a tangential swirl, then settle back with velocity damping
 *  - close particles link with hairline constellation strokes
 *  - particles wrap around the viewport, so the field never empties
 */

type P = {
  x: number; y: number; vx: number; vy: number;
  r: number; depth: number; hue: number; seed: number;
};

const HUES = [332, 275, 215, 152, 45]; // pink, violet, blue, mint, amber (Folio RGB)

export function AntigravityField({
  className,
  density = 1,
  color,
  interactive = true,
  links = true,
}: {
  className?: string;
  /** multiplier on particle count */
  density?: number;
  /** force a single hue (css hsl hue number); omit for the RGB spread */
  color?: number;
  interactive?: boolean;
  links?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      document.documentElement.dataset.motion === "reduce" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let particles: P[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(190, (w * h) / 11000) * density);
      particles = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: -0.08 - Math.random() * 0.22,
          r: 0.6 + depth * 1.9,
          depth,
          hue: color ?? HUES[Math.floor(Math.random() * HUES.length)],
          seed: Math.random() * Math.PI * 2,
        };
      });
    };

    const onResize = () => build();
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };

    build();
    window.addEventListener("resize", onResize);
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    let t = 0;
    const RADIUS = 150;
    // Light "paper" backgrounds need deeper, denser particles to read at all.
    const isDark = () => document.documentElement.classList.contains("dark");
    let lum = isDark() ? 66 : 48;
    let boost = isDark() ? 1 : 1.5;
    const themeObserver = new MutationObserver(() => {
      lum = isDark() ? 66 : 48;
      boost = isDark() ? 1 : 1.5;
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const frame = () => {
      t += 0.006;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // buoyancy + brownian sway (the "antigravity" drift)
        p.vy -= 0.0016 * (0.4 + p.depth);
        p.vx += Math.sin(t * 1.6 + p.seed) * 0.0035;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS && d2 > 0.001) {
            const d = Math.sqrt(d2);
            const f = (1 - d / RADIUS) ** 2 * (0.9 + p.depth);
            // radial push away from the pointer
            p.vx += (dx / d) * f * 0.9;
            p.vy += (dy / d) * f * 0.9;
            // tangential swirl — the orbital signature of the field
            p.vx += (-dy / d) * f * 0.45;
            p.vy += (dx / d) * f * 0.45;
          }
        }

        // damping keeps everything critically calm
        p.vx *= 0.965;
        p.vy *= 0.968;
        p.vy = Math.max(p.vy, -1.6);

        p.x += p.vx;
        p.y += p.vy;

        // wrap
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; p.vy = -0.08; }
        if (p.y > h + 12) p.y = -12;
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;

        const alpha = (0.18 + p.depth * 0.42) * boost;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue} 88% ${lum}% / ${alpha})`;
        ctx.fill();

        // soft bloom on the nearest layer
        if (p.depth > 0.72) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue} 95% ${lum + 6}% / ${0.05 * boost})`;
          ctx.fill();
        }
      }

      if (links) {
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 8100) {
              const o = (1 - Math.sqrt(d2) / 90) * 0.16 * boost;
              ctx.strokeStyle = `hsla(${a.hue} 85% ${lum + 4}% / ${o})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      // static single paint
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue} 90% 66% / ${0.18 + p.depth * 0.3})`;
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [density, color, interactive, links]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
