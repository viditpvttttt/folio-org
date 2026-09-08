import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Unlumen-inspired card — clean, minimal surface with a subtle animated
 * gradient accent line that appears on hover. (Colourful blobs removed.)
 */
export function BlobCard({
  children,
  className,
  colors = ["#ff4d8d", "#b66dff", "#4d9bff", "#7dffb4"],
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
}) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/60 bg-card/45 backdrop-blur p-7 overflow-hidden transition-colors hover:border-border",
        className,
      )}
    >
      {/* Subtle animated gradient accent line (top edge) on hover */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${colors.join(", ")})`,
          backgroundSize: "200% 100%",
          animation: "rgb-slide 3s linear infinite",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
