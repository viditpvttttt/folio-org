import { useState } from "react";
import { Sliders } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { OrbStatus } from "./OrbStatus";
import { cn } from "@/lib/utils";

export type OrbPhysics = { fluidity: number; damping: number; distort: number };

export const DEFAULT_PHYSICS: OrbPhysics = { fluidity: 0.5, damping: 0.5, distort: 0.4 };

export function OrbControls({
  value,
  onChange,
  className,
}: {
  value: OrbPhysics;
  onChange: (v: OrbPhysics) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 transition",
            className,
          )}
          title="Orb physics"
          aria-label="Adjust orb physics"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Orb</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-background/85 backdrop-blur-2xl border-white/15">
        <div className="flex items-center gap-3 mb-4">
          <OrbStatus active amplitude={0.4} listening className="h-14 w-14" {...value} />
          <div>
            <div className="font-serif text-lg leading-tight">Orb physics</div>
            <div className="text-[11px] text-muted-foreground">Tune motion in real time</div>
          </div>
        </div>

        {(
          [
            { key: "fluidity", label: "Fluidity", hint: "How much it sways with sound" },
            { key: "damping", label: "Responsiveness", hint: "Snap vs. drift (higher = snappier)" },
            { key: "distort", label: "Distortion", hint: "Surface turbulence" },
          ] as const
        ).map(({ key, label, hint }) => (
          <div key={key} className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium">{label}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {value[key].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[value[key]]}
              onValueChange={([v]) => onChange({ ...value, [key]: v })}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
          </div>
        ))}

        <button
          onClick={() => onChange(DEFAULT_PHYSICS)}
          className="mt-2 w-full text-xs py-1.5 rounded-md border border-border/60 hover:bg-foreground/5 transition"
        >
          Reset to default
        </button>
      </PopoverContent>
    </Popover>
  );
}
