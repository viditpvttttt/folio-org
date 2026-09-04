import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface BoxRevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  boxColor?: string;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * BoxReveal - As seen on substrate-devs / unlumen UI.
 * A sliding color block wipes across the text/element to reveal it from underneath.
 */
export function BoxReveal({
  children,
  width = "fit-content",
  boxColor = "var(--clay, #c47857)",
  duration = 0.5,
  delay = 0.1,
  className,
}: BoxRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div
      ref={ref}
      style={{ position: "relative", width, overflow: "hidden" }}
      className={cn("inline-block", className)}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 15 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: duration, delay: delay + 0.1 }}
      >
        {children}
      </motion.div>

      <motion.div
        variants={{
          hidden: { left: 0 },
          visible: { left: "100%" },
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: duration, ease: "easeIn", delay }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor,
          borderRadius: "0.25rem",
        }}
      />
    </div>
  );
}
