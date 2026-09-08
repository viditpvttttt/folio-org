import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Unlumen-inspired macOS dock — Gaussian neighbor magnification driven by
 * spring physics. Each icon's scale follows a bell curve centred on the cursor.
 */

export interface DockItem {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

export function Dock({
  items,
  magnification = 2.2,
  distance = 100,
  iconSize = 44,
  gap = 12,
  className,
}: {
  items: DockItem[];
  magnification?: number;
  distance?: number;
  iconSize?: number;
  gap?: number;
  className?: string;
}) {
  const mouseX = useMotionValue(Infinity);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className={cn("flex items-end justify-center", className)}
      style={{ gap }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => { mouseX.set(Infinity); setHovered(null); }}
    >
      {items.map((item, i) => (
        <DockIcon
          key={i}
          item={item}
          mouseX={mouseX}
          magnification={magnification}
          distance={distance}
          iconSize={iconSize}
          isHovered={hovered === i}
          onHoverChange={(h) => setHovered(h ? i : null)}
        />
      ))}
    </div>
  );
}

function DockIcon({
  item,
  mouseX,
  magnification,
  distance,
  iconSize,
  isHovered,
  onHoverChange,
}: {
  item: DockItem;
  mouseX: ReturnType<typeof useMotionValue>;
  magnification: number;
  distance: number;
  iconSize: number;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const dist = useTransform(mouseX, (x) => {
    const el = ref.current;
    if (!el) return Infinity;
    const r = el.getBoundingClientRect();
    return Math.abs(x - (r.left + r.width / 2));
  });

  // Gaussian bell curve: scale = (mag−1)·e^(−d²/2σ²) + 1
  const scaleTarget = useTransform(dist, (d) =>
    (magnification - 1) * Math.exp(-(d * d) / (2 * distance * distance)) + 1,
  );
  const scale = useSpring(scaleTarget, { stiffness: 300, damping: 22, mass: 0.5 });

  const inner = (
    <motion.div
      ref={ref}
      style={{ scale, width: iconSize, height: iconSize, transformOrigin: "bottom" }}
      className="grid place-items-center rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md text-foreground/80 hover:bg-card/80 transition-colors"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {item.icon}
    </motion.div>
  );

  return (
    <div className="relative flex flex-col items-center">
      {isHovered && (
        <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border border-border/40 bg-card/80 px-2.5 py-1 text-xs text-foreground backdrop-blur-md">
          {item.label}
        </span>
      )}
      {item.href ? <a href={item.href}>{inner}</a>
        : item.onClick ? <button onClick={item.onClick}>{inner}</button>
        : inner}
    </div>
  );
}
