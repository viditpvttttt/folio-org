import { useRef, type ReactNode, type CSSProperties } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/* ===================================================================
   21st.dev-inspired scroll-driven animation primitives.
   Unlike the trigger-based Reveal (fires once on intersection), these
   tie directly to scroll progress so elements animate continuously as
   the user scrolls — creating a more alive, tactile feel.
=================================================================== */

/* 1 — ScrollReveal: scroll-driven entrance with configurable direction */
export function ScrollReveal({
  children, className, direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale" | "blur" | "rotate";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 1], direction === "up" ? [60, 0] : direction === "down" ? [-60, 0] : [0, 0]);
  const x = useTransform(scrollYProgress, [0, 1], direction === "left" ? [60, 0] : direction === "right" ? [-60, 0] : [0, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], direction === "scale" ? [0.85, 1] : [1, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], direction === "rotate" ? [-6, 0] : [0, 0]);
  const filter = useTransform(scrollYProgress, [0, 1], direction === "blur" ? ["blur(10px)", "blur(0px)"] : ["blur(0px)", "blur(0px)"]);

  return (
    <motion.div ref={ref} style={{ opacity, x, y, scale, rotate, filter }} className={className}>
      {children}
    </motion.div>
  );
}

/* 2 — ParallaxLayer: children drift at a different speed than scroll */
export function ParallaxLayer({
  children, className, speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, -speed * 120]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* 3 — MaskedTextReveal: words slide up from behind a mask as you scroll */
function MaskedWord({
  word, index, total, scrollYProgress,
}: {
  word: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / total;
  const end = Math.min(start + 2 / total, 1);
  const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
  const y = useTransform(scrollYProgress, [start, end], ["110%", "0%"]);

  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span className="inline-block" style={{ opacity, y }}>
        {word}&nbsp;
      </motion.span>
    </span>
  );
}

export function MaskedTextReveal({
  text, className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.35"],
  });
  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((word, i) => (
        <MaskedWord key={i} word={word} index={i} total={words.length} scrollYProgress={scrollYProgress} />
      ))}
    </span>
  );
}

/* 4 — ScrollTilt: 3D tilt that responds to scroll position */
export function ScrollTilt({
  children, className, max = 8,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [max, 0, -max]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.92]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, scale, transformStyle: "preserve-3d", perspective: 1000 } as CSSProperties}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* 5 — ScrollScale: element grows from `from` to `to` as it enters the viewport */
export function ScrollScale({
  children, className, from = 0.85, to = 1,
}: {
  children: ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
}
