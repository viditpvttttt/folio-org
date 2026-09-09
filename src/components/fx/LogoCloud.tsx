import { cn } from "@/lib/utils";

/**
 * Clean, minimal "trusted by" marquee with edge fade masks.
 * Uses the existing marquee-row-scroll CSS animation.
 */
export function LogoCloud({
  names,
  className,
  speed = 40,
}: {
  names: string[];
  className?: string;
  speed?: number;
}) {
  const row = [...names, ...names];
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="marquee-row">
        <div
          className="marquee-row__track"
          style={{ ["--speed" as string]: `${speed}s` }}
        >
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-lg font-serif text-muted-foreground/40 whitespace-nowrap px-8 transition-colors hover:text-muted-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
