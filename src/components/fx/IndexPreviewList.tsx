import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IndexItem {
  id: string;
  number: string;
  title: string;
  description: string;
  category: string;
  href: string;
  previewGradient?: string;
  previewDetails?: string[];
}

interface IndexPreviewListProps {
  items: IndexItem[];
  className?: string;
}

/**
 * Interactive Directory Index with floating 3D tilt preview card following the mouse.
 */
export function IndexPreviewList({ items, className }: IndexPreviewListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<IndexItem | null>(null);

  // Mouse coordinates inside container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for floating preview
  const springConfig = { damping: 25, stiffness: 250 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative w-full", className)}
    >
      <div className="divide-y divide-border/70 border-y border-border/70">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            onMouseEnter={() => setActiveItem(item)}
            onMouseLeave={() => setActiveItem(null)}
            className="group relative flex items-baseline justify-between gap-6 py-7 px-4 transition-colors hover:bg-accent/40 rounded-xl"
          >
            <span className="flex items-baseline gap-6 sm:gap-8">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
                {item.number}
              </span>
              <span className="font-display font-light text-2xl sm:text-4xl text-foreground transition-transform duration-300 group-hover:translate-x-3">
                {item.title}
              </span>
            </span>

            <div className="flex items-center gap-6">
              <span className="hidden text-sm text-muted-foreground sm:inline-block font-sans">
                {item.description}
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-all group-hover:border-foreground group-hover:text-foreground group-hover:scale-110">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Floating 3D Cursor-Tracking Preview Card */}
      {activeItem && (
        <motion.div
          style={{
            left: smoothX,
            top: smoothY,
            x: "-50%",
            y: "-110%",
            pointerEvents: "none",
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2 }}
          className="absolute z-40 hidden lg:block w-72 rounded-2xl border border-white/20 bg-background/90 p-5 shadow-2xl backdrop-blur-xl"
        >
          <div
            className="h-28 w-full rounded-xl p-4 flex flex-col justify-between text-white"
            style={{
              background:
                activeItem.previewGradient ||
                "linear-gradient(135deg, var(--spectral-b, #7b6bd6), var(--spectral-r, #e0574a))",
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
              {activeItem.category}
            </span>
            <span className="font-serif text-xl font-light">
              {activeItem.title}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{activeItem.description}</p>
            {activeItem.previewDetails && (
              <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                {activeItem.previewDetails.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
