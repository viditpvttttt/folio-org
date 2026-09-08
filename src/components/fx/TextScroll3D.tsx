import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Skiper-inspired 3D scroll text — characters rotate in perspective as you
 * scroll through the section, creating a wave of letters that face the viewer
 * then turn away. Each character has a slight delay based on its offset from
 * the centre, producing a ripple effect.
 */
export function TextScroll3D({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const chars = text.split("");
  const center = Math.floor(chars.length / 2);

  return (
    <div
      ref={ref}
      className={cn("relative flex items-center justify-center overflow-hidden py-32", className)}
      style={{ perspective: "600px" }}
    >
      <div className="flex">
        {chars.map((char, i) => (
          <Char3D
            key={i}
            char={char}
            offset={i - center}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}

function Char3D({
  char,
  offset,
  scrollYProgress,
}: {
  char: string;
  offset: number;
  scrollYProgress: MotionValue<number>;
}) {
  const delay = offset * 0.035;

  const rotateY = useTransform(scrollYProgress, (v) => {
    const local = Math.max(0, Math.min(1, v + delay));
    return (local - 0.5) * 180;
  });
  const opacity = useTransform(rotateY, [-90, -50, 0, 50, 90], [0, 0.2, 1, 0.2, 0]);
  const scale = useTransform(rotateY, [-90, 0, 90], [0.3, 1, 0.3]);

  return (
    <motion.span
      className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-none tracking-tight"
      style={{ rotateY, opacity, scale, transformStyle: "preserve-3d" }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}
