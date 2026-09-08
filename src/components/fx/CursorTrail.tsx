import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Unlumen-inspired cursor trail — coloured gradient cards follow the cursor
 * with fade, scale, and rotation. Adapted to use gradient divs instead of
 * images so it works without external assets.
 */
export function CursorTrail({
  gradients = [
    "linear-gradient(135deg, #ff4d8d, #b66dff)",
    "linear-gradient(135deg, #4d9bff, #7dffb4)",
    "linear-gradient(135deg, #ffd24d, #ff4d8d)",
    "linear-gradient(135deg, #b66dff, #4d9bff)",
  ],
  cardSize = 100,
  trailLength = 8,
  spawnDistance = 80,
  rotationRange = 20,
  className,
  children,
}: {
  gradients?: string[];
  cardSize?: number;
  trailLength?: number;
  spawnDistance?: number;
  rotationRange?: number;
  className?: string;
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const counter = useRef(0);
  const [trail, setTrail] = useState<{ id: number; x: number; y: number; rot: number; grad: string }[]>([]);

  const onMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - lastPos.current.x;
    const dy = y - lastPos.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < spawnDistance) return;
    lastPos.current = { x, y };
    const id = counter.current++;
    const rot = (Math.random() - 0.5) * 2 * rotationRange;
    const grad = gradients[id % gradients.length];
    setTrail((prev) => [...prev, { id, x, y, rot, grad }].slice(-trailLength));
    setTimeout(() => setTrail((prev) => prev.filter((t) => t.id !== id)), 1400);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={onMove}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      <AnimatePresence>
        {trail.map((item, i) => {
          const depth = trail.length - 1 - i;
          return (
            <motion.div
              key={item.id}
              className="pointer-events-none absolute rounded-2xl"
              style={{
                width: cardSize,
                height: cardSize,
                left: item.x - cardSize / 2,
                top: item.y - cardSize / 2,
                background: item.grad,
                rotate: item.rot,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: Math.max(0, 1 - depth * 0.13), scale: Math.max(0.3, 1 - depth * 0.08) }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
