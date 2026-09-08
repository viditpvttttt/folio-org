import { useRef } from "react";
import { useAnimationFrame } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Unlumen-inspired aurora bars — undulating gradient bars driven by
 * procedural noise (two blended sine waves + an arch envelope).
 */
export function AuroraBars({
  barCount = 28,
  colors,
  speed = 0.5,
  blur = 0,
  className,
}: {
  barCount?: number;
  colors?: string[];
  speed?: number;
  blur?: number;
  className?: string;
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  const gradientColors = colors ?? ["#ff4d8d", "#b66dff", "#4d9bff", "#7dffb4", "transparent"];
  const gradient = `linear-gradient(to top, ${gradientColors.join(", ")})`;

  useAnimationFrame((t) => {
    const time = t * 0.001 * speed;
    for (let i = 0; i < barCount; i++) {
      const bar = barsRef.current[i];
      if (!bar) continue;
      const wave1 = Math.sin(time + i * 0.45);
      const wave2 = Math.sin(time * 1.3 + i * 0.3);
      const arch = Math.sin((i / (barCount - 1)) * Math.PI);
      const h = 0.18 + 0.74 * (0.5 + 0.5 * (wave1 * 0.6 + wave2 * 0.4)) * (0.35 + 0.65 * arch);
      bar.style.transform = `scaleY(${h})`;
    }
  });

  return (
    <div className={cn("flex items-end justify-center gap-[3px]", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className="flex-1 origin-bottom rounded-t-full"
          style={{
            height: "100%",
            background: gradient,
            transform: "scaleY(0.3)",
            filter: blur ? `blur(${blur}px)` : undefined,
          }}
        />
      ))}
    </div>
  );
}
