import { cn } from "@/lib/utils";

/** Tiny live-status dot with a softly pulsing ring. */
export function PulseDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2 shrink-0", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}
