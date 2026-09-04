import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollDrawCurveProps {
  className?: string;
  quote?: string;
}

/**
 * Animated SVG S-curve gradient path that dynamically draws itself on scroll.
 * Accompanied by a word-by-word scroll-driven opacity highlight.
 */
export function ScrollDrawCurve({
  className,
  quote = "The same runtime, the same memory, the same notion of context runs under all of it. Not three products bolted together — one substrate wearing three faces.",
}: ScrollDrawCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"],
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.9], [0, 1]);
  const words = quote.split(" ");

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate overflow-hidden border-t border-border/70 py-28 sm:py-36",
        className
      )}
    >
      {/* Background soft spectral glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--spectral-b, #7b6bd6) 0%, var(--spectral-r, #e0574a) 40%, transparent 70%)",
        }}
      />

      {/* SVG S-Curve dynamically drawn */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-44 -translate-x-1/2 opacity-60 lg:block -z-10"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 120 600"
          fill="none"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M60 0
               C 60 60, 20 80, 20 140
               C 20 200, 100 210, 100 270
               C 100 330, 20 340, 20 400
               C 20 460, 100 470, 100 530
               C 100 570, 60 580, 60 600"
            stroke="url(#spectral-curve-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              pathLength,
            }}
          />
          <defs>
            <linearGradient
              id="spectral-curve-grad"
              x1="0"
              y1="0"
              x2="0"
              y2="600"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="var(--spectral-b, #7b6bd6)" />
              <stop offset="0.5" stopColor="var(--spectral-r, #e0574a)" />
              <stop offset="1" stopColor="var(--spectral-g, #5f8c6a)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Centered large editorial text with scroll reveal */}
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="font-serif text-3xl sm:text-5xl font-light leading-snug tracking-tight text-foreground">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(scrollYProgress, [start * 0.8, end * 0.8], [0.2, 1]);

            return (
              <motion.span
                key={i}
                style={{ opacity }}
                className="inline-block transition-opacity duration-150"
              >
                {word}&nbsp;
              </motion.span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
