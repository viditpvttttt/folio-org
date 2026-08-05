import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { AntigravityField } from "@/components/fx/AntigravityField";
import { AppNav } from "@/components/shell/AppNav";
import { cn } from "@/lib/utils";

/** Ambient 3D + RGB + antigravity particle backdrop shared by every app section. */
export function AppBackdrop({ scene = true, density = 1 }: { scene?: boolean; density?: number }) {
  return (
    <>
      {scene && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 opacity-70">
          <AmbientScene />
        </div>
      )}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#ff4d8d_0%,transparent_65%)] opacity-35 blur-3xl" />
        <div className="absolute top-32 -right-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,#4d9bff_0%,transparent_65%)] opacity-35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,#b66dff_0%,transparent_65%)] opacity-30 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_center,#7dffb4_0%,transparent_65%)] opacity-25 blur-3xl" />
      </div>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-background/55 backdrop-blur-[2px]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <AntigravityField density={density} />
      </div>
    </>
  );
}

export function AppShell({
  children,
  right,
  className,
  scene = true,
  density = 1,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  scene?: boolean;
  density?: number;
}) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-x-hidden bg-background text-foreground paper-grain", className)}>
      <AppBackdrop scene={scene} density={density} />
      <CursorGlow />
      <AppNav right={right} />
      {children}
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
      <div aria-hidden className="pointer-events-none absolute -left-10 -top-16 h-56 w-72 rounded-full rgb-blob opacity-25 blur-3xl" />
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
    </div>
  );
}

/** Glass card with an RGB hover bloom — the app-wide surface primitive. */
export function GlassCard({
  children, className, glow = true,
}: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-border",
        className,
      )}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full rgb-blob opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-30"
        />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
