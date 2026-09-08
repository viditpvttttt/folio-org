import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ===================================================================
   Reusable animation primitives — applied across the landing page
   to reach 35+ distinct animation instances.
=================================================================== */

/* 1 — Float: gentle up-down floating loop */
export function Float({
  children, className, duration = 6, delay = 0,
}: { children: ReactNode; className?: string; duration?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* 2 — PulseGlow: pulsing box-shadow ring */
export function PulseGlow({
  children, className, color = "rgba(182, 109, 255, 0.35)",
}: { children: ReactNode; className?: string; color?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ boxShadow: [`0 0 0px ${color}`, `0 0 24px ${color}`, `0 0 0px ${color}`] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/* 3 — SplitText: word-by-word reveal on scroll into view */
export function SplitText({
  text, className, delay = 0,
}: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const words = text.split(" ");
  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delay + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

/* 4 — StaggerChildren / StaggerItem: staggered entrance */
export function StaggerChildren({
  children, className, stagger = 0.08,
}: { children: ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* 5 — FlipCard: 3D flip on hover (crossfade + rotate for reliability) */
export function FlipCard({
  front, back, className,
}: { front: ReactNode; back: ReactNode; className?: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: flipped ? -12 : 0, opacity: flipped ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left center" }}
      >
        {front}
      </motion.div>
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 0 : 12, opacity: flipped ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left center" }}
      >
        {back}
      </motion.div>
    </div>
  );
}

/* 6 — WiggleHover: wiggle rotation on hover */
export function WiggleHover({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ rotate: [0, -3, 3, -2, 2, 0] }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

/* 7 — BlurIn: blur-to-focus entrance on scroll */
export function BlurIn({
  children, className, delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(12px)" }}
      animate={inView ? { opacity: 1, filter: "blur(0px)" } : {}}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* 8 — BounceIn: spring bounce entrance on scroll */
export function BounceIn({
  children, className, delay = 0,
}: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

/* 9 — ScaleHover: scale up on hover with spring */
export function ScaleHover({
  children, className, scale = 1.05,
}: { children: ReactNode; className?: string; scale?: number }) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}

/* 10 — SlideIn: slide in from a side on scroll */
export function SlideIn({
  children, className, direction = "left", delay = 0,
}: { children: ReactNode; className?: string; direction?: "left" | "right" | "up" | "down"; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const offsets = { left: [-60, 0], right: [60, 0], up: [0, -60], down: [0, 60] };
  const [x, y] = offsets[direction];
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* 11 — AnimatedCounter: count-up on scroll into view */
export function AnimatedCounter({
  to, suffix = "", duration = 2, className,
}: { to: number; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={className}>
      {count}{suffix}
    </span>
  );
}

/* 12 — TiltHover: spring-smoothed 3D tilt on hover */
export function TiltHover({
  children, className, max = 12,
}: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const smoothRx = useSpring(rx, { stiffness: 300, damping: 20 });
  const smoothRy = useSpring(ry, { stiffness: 300, damping: 20 });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: smoothRx, rotateY: smoothRy, transformStyle: "preserve-3d" } as CSSProperties}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        rx.set((0.5 - (e.clientY - r.top) / r.height) * max);
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/* 13 — GlowHover: glow box-shadow on hover */
export function GlowHover({
  children, className, color = "rgba(182, 109, 255, 0.3)",
}: { children: ReactNode; className?: string; color?: string }) {
  return (
    <motion.div
      className={cn("relative", className)}
      whileHover={{ boxShadow: `0 0 30px ${color}, 0 0 60px ${color}` }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/* 14 — RippleClick: expanding ripple on click */
export function RippleClick({ children, className }: { children: ReactNode; className?: string }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const id = Date.now();
        setRipples((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
        setTimeout(() => setRipples((p) => p.filter((rp) => rp.id !== id)), 600);
      }}
    >
      {children}
      <AnimatePresence>
        {ripples.map((rp) => (
          <motion.span
            key={rp.id}
            className="pointer-events-none absolute rounded-full bg-foreground/20"
            style={{ left: rp.x - 50, top: rp.y - 50, width: 100, height: 100 }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* 15 — GradientBorder: rotating conic-gradient border */
export function GradientBorder({
  children, className, colors = ["#ff4d8d", "#b66dff", "#4d9bff", "#7dffb4"],
}: { children: ReactNode; className?: string; colors?: string[] }) {
  return (
    <div className={cn("relative rounded-2xl", className)}>
      <div
        aria-hidden
        className="gradient-border-anim absolute -inset-[1.5px] rounded-2xl opacity-40"
        style={{ background: `conic-gradient(from 0deg, ${colors.join(", ")}, ${colors[0]})` }}
      />
      <div className="relative rounded-2xl border border-border/40 bg-card">{children}</div>
    </div>
  );
}

/* 16 — AnimatedUnderline: draw-on underline on hover */
export function AnimatedUnderline({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("animated-underline group inline-block", className)}>
      {children}
      <span className="animated-underline__line" />
    </span>
  );
}

/* 17 — ShimmerHover: diagonal shimmer sweep on hover */
export function ShimmerHover({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("shimmer-hover group relative overflow-hidden", className)}>
      <div className="shimmer-hover__sweep" />
      {children}
    </div>
  );
}

/* 18 — GradientText: animated shifting gradient text */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-gradient-animate", className)}>
      {children}
    </span>
  );
}

/* 19 — MarqueeRow: infinite horizontal scroller */
export function MarqueeRow({
  items, speed = 30, reverse = false, className,
}: { items: string[]; speed?: number; reverse?: boolean; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={cn("marquee-row overflow-hidden", className)}>
      <div
        className={cn("marquee-row__track", reverse && "marquee-row__track--rev")}
        style={{ ["--speed" as string]: `${speed}s` }}
      >
        {row.map((t, i) => (
          <span key={`${t}-${i}`} className="marquee-row__chip">{t}</span>
        ))}
      </div>
    </div>
  );
}
