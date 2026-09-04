import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface WordRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}

/**
 * Word-by-word blur-to-focus reveal animation.
 * Words emerge with upward translation, blur filter fade, and spring damping.
 */
export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.045,
}: WordRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      <motion.span
        className="inline-block"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{
          staggerChildren: stagger,
          delayChildren: delay,
        }}
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.12em] align-bottom"
          >
            <motion.span
              variants={{
                hidden: {
                  opacity: 0,
                  filter: "blur(8px)",
                  y: "108%",
                },
                visible: {
                  opacity: 1,
                  filter: "blur(0px)",
                  y: "0%",
                  transition: {
                    duration: 0.75,
                    ease: "easeOut",
                  },
                },
              }}
              className={cn("inline-block will-change-transform", wordClassName)}
            >
              {word}&nbsp;
            </motion.span>
          </span>
        ))}
      </motion.span>
    </span>
  );
}
