import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

interface ButtonShineProps {
  children: React.ReactNode;
  className?: string;
  magnetic?: boolean;
  strength?: number;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

/**
 * Button with magnetic cursor pull and sweeping light shine effect.
 */
export function ButtonShine({
  children,
  className,
  magnetic = true,
  strength = 0.3,
  href,
  onClick,
  type = "button",
}: ButtonShineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <span className="relative z-10 flex items-center gap-2">{children}</span>
  );

  const commonClass = cn(
    "btn-shine relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl active:scale-95",
    className
  );

  return (
    <motion.div
      ref={ref}
      style={{ x: smoothX, y: smoothY }}
      onPointerMove={handleMouseMove}
      onPointerLeave={handleMouseLeave}
      className="inline-block"
    >
      {href ? (
        <a href={href} onClick={onClick} className={commonClass}>
          {content}
        </a>
      ) : (
        <button type={type} onClick={onClick} className={commonClass}>
          {content}
        </button>
      )}
    </motion.div>
  );
}
