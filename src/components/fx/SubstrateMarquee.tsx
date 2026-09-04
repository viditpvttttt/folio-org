import { cn } from "@/lib/utils";

interface SubstrateMarqueeProps {
  items: string[];
  className?: string;
  reverse?: boolean;
}

/**
 * Substrate Infinite Ticker with clay separator dots and uppercase mono typography.
 */
export function SubstrateMarquee({
  items,
  className,
  reverse = false,
}: SubstrateMarqueeProps) {
  const trackClass = reverse ? "marquee-track-reverse" : "marquee-track";

  return (
    <div
      className={cn(
        "overflow-hidden py-1 hover:[&_.marquee-track]:[animation-play-state:paused] hover:[&_.marquee-track-reverse]:[animation-play-state:paused]",
        className
      )}
    >
      <div className={trackClass}>
        {/* Track 1 */}
        <div className="flex shrink-0 items-center" aria-hidden="false">
          {items.map((item, i) => (
            <span
              key={i}
              className="mx-6 sm:mx-8 inline-flex items-center gap-6 sm:gap-8 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {item}
              <span className="text-[var(--clay,#c47857)] font-bold">·</span>
            </span>
          ))}
        </div>

        {/* Track 2 (Duplicate for seamless loop) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {items.map((item, i) => (
            <span
              key={`dup-${i}`}
              className="mx-6 sm:mx-8 inline-flex items-center gap-6 sm:gap-8 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {item}
              <span className="text-[var(--clay,#c47857)] font-bold">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
