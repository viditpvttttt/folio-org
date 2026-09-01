import { useRef } from "react";
import { AppNav } from "@/components/shell/AppNav";
import { DepthSlabs } from "@/components/fx/DepthSlabs";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

/**
 * Ambient backdrop — flat aurora sheets, a fine engraving grid and
 * Skiper-style depth slabs. Deliberately free of orbs, blobs and particles.
 */
export function AppBackdrop({ scene = true }: { scene?: boolean; density?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {scene && <div className="absolute inset-x-0 top-0 h-[46vh] aurora-sheet opacity-70" />}
      {scene && <DepthSlabs className="opacity-70" layers={5} intensity={0.7} />}
      <div className="absolute inset-x-0 bottom-0 h-[36vh] aurora-sheet-b opacity-50" />
      <div className="absolute inset-0 grid-fine opacity-[0.55]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,var(--color-background))] opacity-60" />
    </div>
  );
}


export function AppShell({
  children,
  right,
  className,
  scene = true,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  scene?: boolean;
  density?: number;
}) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-x-hidden bg-background text-foreground paper-grain", className)}>
      <AppBackdrop scene={scene} />
      <div className="relative z-10">
        <AppNav right={right} />
        {children}
      </div>
    </div>
  );
}

/** Page title block matching the landing page's editorial rhythm. */
export function PageHeading({
  eyebrow, title, subtitle, icon: Icon, actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative mb-10">
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {Icon && <Icon className="h-3.5 w-3.5" />} {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl leading-[0.98] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div aria-hidden className="mt-8 h-px w-full rgb-line opacity-60" />
    </div>
  );
}

/**
 * Glass card with real depth: pointer-tracked 3D tilt, a light sheen that
 * follows the cursor, and a lifted shadow. No blobs.
 */
export function GlassCard({
  children, className, glow = true, tilt = 5,
}: { children: React.ReactNode; className?: string; glow?: boolean; tilt?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${-y * tilt}deg`);
    el.style.setProperty("--ry", `${x * tilt}deg`);
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="h-full [perspective:1100px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn("card-3d group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl", className)}
      >
        {glow && <span aria-hidden className="card-sheen" />}
        <div className="relative h-full [transform:translateZ(28px)]">{children}</div>
      </div>
    </div>
  );
}
