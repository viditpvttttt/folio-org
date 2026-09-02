import { cn } from "@/lib/utils";

/** Tilted, perspective infinite marquee (Skiper/Substrate-style ribbon). */
export function Marquee3D({
  items,
  reverse = false,
  speed = 32,
  className,
}: {
  items: string[];
  reverse?: boolean;
  speed?: number;
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("marquee3d", className)} aria-hidden>
      <div className="marquee3d__stage">
        <div
          className={cn("marquee3d__track", reverse && "marquee3d__track--rev")}
          style={{ ["--speed" as string]: `${speed}s` }}
        >
          {row.map((t, i) => (
            <span key={`${t}-${i}`} className="marquee3d__chip">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
