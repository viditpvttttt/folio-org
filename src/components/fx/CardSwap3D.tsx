import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Skiper-style "card swap": a perspective stack of cards where the front card
 * drops away and the stack rotates forward on an interval (or on click).
 */
export function CardSwap3D({
  items,
  interval = 3400,
  className,
}: {
  items: { title: string; body: string; tag?: string; icon?: ReactNode }[];
  interval?: number;
  className?: string;
}) {
  const [top, setTop] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => setTop((t) => (t + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [paused, interval, items.length]);

  return (
    <div
      className={cn("card-swap relative select-none", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => setTop((t) => (t + 1) % items.length)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setTop((t) => (t + 1) % items.length)}
      aria-label="Next card"
    >
      <div className="card-swap__stage">
        {items.map((item, i) => {
          const pos = (i - top + items.length) % items.length;
          return (
            <article
              key={item.title}
              className="card-swap__card"
              style={{
                ["--pos" as string]: pos,
                zIndex: items.length - pos,
                opacity: pos > 2 ? 0 : 1,
              }}
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                {item.icon}
                {item.tag ?? "Folio"}
              </div>
              <h3 className="font-serif text-2xl md:text-3xl mt-4 tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
