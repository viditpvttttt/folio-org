import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StickyCardItem {
  number: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  tileA: string;
  tileB: string;
  tileC: string;
}

interface StickyCardsProps {
  cards: StickyCardItem[];
  className?: string;
}

function StickyCard({
  card,
  index,
  total,
}: {
  card: StickyCardItem;
  index: number;
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  });

  // Calculate target scale and dimming as newer cards stack on top
  const targetScale = 1 - (total - 1 - index) * 0.04;
  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);

  return (
    <div
      ref={containerRef}
      className="sticky top-24 sm:top-28 flex min-h-[70vh] sm:min-h-[75vh] items-center justify-center py-6"
      style={{
        zIndex: index + 10,
        top: `calc(5.5rem + ${index * 1.5}rem)`,
      }}
    >
      <motion.div
        style={{
          scale,
          transformOrigin: "top center",
          "--tile-a": card.tileA,
          "--tile-b": card.tileB,
          "--tile-c": card.tileC,
        } as unknown as React.CSSProperties}
        className={cn(
          "tile-aurora group relative flex min-h-[24rem] sm:min-h-[27rem] w-full max-w-5xl flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-12 shadow-2xl transition-all duration-500 will-change-transform border border-white/20"
        )}
      >
        {/* Subtle mesh glare */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />

        {/* Top bar: Badge & Index */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rule-label !text-white/90">{card.badge}</span>
          </div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-white/70">
            {card.number} / {String(total).padStart(2, "0")}
          </p>
        </div>

        {/* Center: Title & Description */}
        <div className="my-auto max-w-2xl">
          <h3 className="text-3xl sm:text-5xl font-light text-white leading-tight drop-shadow-sm font-display">
            {card.title}
          </h3>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/85">
            {card.description}
          </p>

          {card.actionText && (
            <a
              href={card.actionHref || "#"}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              <span>{card.actionText}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * StickyCards - Multi-layer 3D stacking cards on scroll.
 * Recreates the iconic Substrate "Three products, one shared ground" sticky stack.
 */
export function StickyCards({ cards, className }: StickyCardsProps) {
  return (
    <div className={cn("relative mx-auto max-w-5xl px-6 pb-20", className)}>
      {cards.map((card, idx) => (
        <StickyCard
          key={card.number}
          card={card}
          index={idx}
          total={cards.length}
        />
      ))}
    </div>
  );
}
