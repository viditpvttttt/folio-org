import { cn } from "@/lib/utils";

interface KineticTextProps {
  text: string;
  className?: string;
  staggerMs?: number;
}

/**
 * Kinetic roll-up text animation on hover.
 * Each character rolls up and is replaced by another from below with a staggered delay.
 */
export function KineticText({
  text,
  className,
  staggerMs = 18,
}: KineticTextProps) {
  const letters = Array.from(text);

  return (
    <span
      className={cn(
        "group/kinetic relative inline-block overflow-hidden align-bottom select-none",
        className
      )}
    >
      {/* Top primary row (slides up on hover) */}
      <span className="flex">
        {letters.map((char, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/kinetic:-translate-y-full"
            style={{ transitionDelay: `${i * staggerMs}ms` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Bottom duplicate row (slides in from below on hover) */}
      <span className="absolute inset-0 flex" aria-hidden="true">
        {letters.map((char, i) => (
          <span
            key={i}
            className="inline-block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover/kinetic:translate-y-0"
            style={{ transitionDelay: `${i * staggerMs}ms` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </span>
  );
}
