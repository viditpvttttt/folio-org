import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

/**
 * Animated number counter that counts up to the target value when scrolled into view.
 */
export function Counter({
  value,
  duration = 1.6,
  suffix = "",
  prefix = "",
  className,
}: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    const totalFrames = Math.round((duration * 1000) / 16);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      // easeOutExpo
      const progress = frame / totalFrames;
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * ease);

      setCount(current);

      if (frame >= totalFrames) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}
