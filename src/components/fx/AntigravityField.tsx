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
 *
 * Polish pass: fixed-timestep integration (identical motion at any refresh
 * rate), a smoothed pointer so the swirl never snaps, edge fade-in/out so
 * particles are born and die softly, gentle twinkle, and a spatial hash for the
 * constellation links so density can go up without the frame cost.
 */

type P = {
  x: number; y: number; vx: number; vy: number;
  r: number; depth: number; hue: number; seed: number; tw: number;
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
    // raw pointer + smoothed pointer (the well actually follows the smoothed one)
    const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false, ease: 0 };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(220, (w * h) / 9500) * density);
      particles = Array.from({ length: count }, () => {
        const depth = Math.random() ** 1.4; // more small far particles than near ones
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -0.06 - Math.random() * 0.2,
          r: 0.5 + depth * 2.0,
          depth,
          hue: color ?? HUES[Math.floor(Math.random() * HUES.length)],
          seed: Math.random() * Math.PI * 2,
          tw: 0.4 + Math.random() * 0.9,
        };
      });
      // far particles first → natural depth stacking
      particles.sort((a, b) => a.depth - b.depth);
    };

    const onResize = () => build();
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - rect.left;
      ptr.ty = e.clientY - rect.top;
      if (!ptr.active) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
      ptr.active = true;
    };
    const onLeave = () => { ptr.active = false; };

    build();
    window.addEventListener("resize", onResize);
    if (interactive) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    let t = 0;
    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 60;
    const RADIUS = 165;
    const LINK = 96;
    const LINK2 = LINK * LINK;

    // Light "paper" backgrounds need deeper, denser particles to read at all.
    const isDark = () => document.documentElement.classList.contains("dark");
    let lum = isDark() ? 68 : 40;
    let boost = isDark() ? 1 : 2.6;
    const themeObserver = new MutationObserver(() => {
      lum = isDark() ? 68 : 40;
      boost = isDark() ? 1 : 2.6;
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const simulate = () => {
      t += 0.006;

      // smoothed pointer + eased influence ramp (no snap on enter/leave)
      ptr.x += (ptr.tx - ptr.x) * 0.16;
      ptr.y += (ptr.ty - ptr.y) * 0.16;
      ptr.ease += ((ptr.active ? 1 : 0) - ptr.ease) * 0.08;

      for (const p of particles) {
        // buoyancy + brownian sway (the "antigravity" drift)
        p.vy -= 0.0014 * (0.35 + p.depth);
        p.vx += Math.sin(t * 1.5 + p.seed) * 0.0032;

        if (ptr.ease > 0.01) {
          const dx = p.x - ptr.x;
          const dy = p.y - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS && d2 > 0.001) {
            const d = Math.sqrt(d2);
            // smoothstep falloff — much softer at the rim than the old squared ramp
            const n = 1 - d / RADIUS;
            const f = n * n * (3 - 2 * n) * (0.75 + p.depth * 0.6) * ptr.ease;
            p.vx += (dx / d) * f * 0.8;
            p.vy += (dy / d) * f * 0.8;
            // tangential swirl — the orbital signature of the field
            p.vx += (-dy / d) * f * 0.5;
            p.vy += (dx / d) * f * 0.5;
          }
        }

        // damping keeps everything critically calm
        p.vx *= 0.962;
        p.vy *= 0.966;
        p.vy = Math.max(p.vy, -1.5);
        p.vx = Math.max(-1.6, Math.min(1.6, p.vx));

        p.x += p.vx;
        p.y += p.vy;

        // wrap
        if (p.y < -16) { p.y = h + 16; p.x = Math.random() * w; p.vy = -0.06; p.vx *= 0.2; }
        if (p.y > h + 16) p.y = -16;
        if (p.x < -16) p.x = w + 16;
        if (p.x > w + 16) p.x = -16;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (links) {
        // spatial hash so link lookup is local instead of O(n²)
        const cell = LINK;
        const cols = Math.max(1, Math.ceil(w / cell) + 2);
        const grid = new Map<number, P[]>();
        for (const p of particles) {
          const key = (Math.floor(p.y / cell) + 1) * cols + (Math.floor(p.x / cell) + 1);
          const bucket = grid.get(key);
          if (bucket) bucket.push(p); else grid.set(key, [p]);
        }
        ctx.lineWidth = 0.55;
        for (const p of particles) {
          const cx = Math.floor(p.x / cell) + 1;
          const cy = Math.floor(p.y / cell) + 1;
          for (let oy = 0; oy <= 1; oy++) {
            for (let ox = oy === 0 ? 0 : -1; ox <= 1; ox++) {
              const bucket = grid.get((cy + oy) * cols + (cx + ox));
              if (!bucket) continue;
              for (const q of bucket) {
                if (q === p) continue;
                if (oy === 0 && ox === 0 && q.x < p.x) continue; // dedupe within cell
                const dx = p.x - q.x, dy = p.y - q.y;
                const d2 = dx * dx + dy * dy;
                if (d2 >= LINK2) continue;
                const o = (1 - Math.sqrt(d2) / LINK) ** 1.6 * 0.19 * boost;
                if (o < 0.008) continue;
                ctx.strokeStyle = `hsla(${p.hue} 85% ${lum + 4}% / ${o})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      for (const p of particles) {
        // soft birth/death at the vertical edges so nothing ever pops
        const edge = Math.min(1, Math.min(p.y + 16, h + 16 - p.y) / 60);
        const twinkle = 0.85 + Math.sin(t * 3.1 * p.tw + p.seed) * 0.15;
        const alpha = (0.14 + p.depth * 0.44) * boost * edge * twinkle;
        if (alpha <= 0.004) continue;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue} 90% ${lum}% / ${alpha})`;
        ctx.fill();

        // soft bloom on the nearest layer
        if (p.depth > 0.7) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          g.addColorStop(0, `hsla(${p.hue} 95% ${lum + 8}% / ${0.1 * boost * edge})`);
          g.addColorStop(1, `hsla(${p.hue} 95% ${lum + 8}% / 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      // fixed timestep — identical motion on 60Hz and 144Hz, no jumps after a tab stall
      acc = Math.min(acc + (now - last), 100);
      last = now;
      while (acc >= STEP) { simulate(); acc -= STEP; }
      draw();
      raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      draw();
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
