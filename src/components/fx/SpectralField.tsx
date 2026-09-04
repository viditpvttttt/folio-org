import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SpectralFieldProps {
  className?: string;
  intensity?: "soft" | "bold" | "subtle";
  withGrain?: boolean;
}

/**
 * Ambient multi-hue spectral aura mesh gradient with slow drifting physics.
 * Recreates the exact substrate-devs / skiper-ui spectral field ambience.
 */
export function SpectralField({
  className,
  intensity = "soft",
  withGrain = true,
}: SpectralFieldProps) {
  const opacities = {
    subtle: { a: 0.25, b: 0.2, c: 0.2, d: 0.18 },
    soft: { a: 0.5, b: 0.45, c: 0.4, d: 0.35 },
    bold: { a: 0.75, b: 0.7, c: 0.65, d: 0.6 },
  }[intensity];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none -z-10",
        className
      )}
    >
      {/* Aurora Blob 1 - Spectral Blue/Purple */}
      <motion.div
        className="absolute -left-[15%] top-[-20%] h-[75vh] w-[75vh] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, var(--spectral-b, #7b6bd6) 0%, transparent 70%)",
          opacity: opacities.a,
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, 35, 15, 0],
          scale: [1, 1.08, 0.94, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora Blob 2 - Spectral Red/Clay */}
      <motion.div
        className="absolute right-[-12%] top-[8%] h-[65vh] w-[65vh] rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, var(--spectral-r, #e0574a) 0%, transparent 70%)",
          opacity: opacities.b,
        }}
        animate={{
          x: [0, -45, 25, 0],
          y: [0, 30, -25, 0],
          scale: [1, 0.95, 1.06, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora Blob 3 - Spectral Green/Sage */}
      <motion.div
        className="absolute bottom-[-22%] left-[25%] h-[70vh] w-[70vh] rounded-full blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, var(--spectral-g, #5f8c6a) 0%, transparent 70%)",
          opacity: opacities.c,
        }}
        animate={{
          x: [0, 35, -35, 0],
          y: [0, -25, 20, 0],
          scale: [1, 1.05, 0.96, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aurora Blob 4 - Spectral Yellow/Amber */}
      <motion.div
        className="absolute right-[8%] bottom-[-15%] h-[55vh] w-[55vh] rounded-full blur-[105px]"
        style={{
          background:
            "radial-gradient(circle, var(--spectral-y, #e5a742) 0%, transparent 70%)",
          opacity: opacities.d,
        }}
        animate={{
          x: [0, -30, 30, 0],
          y: [0, 20, -30, 0],
          scale: [1, 1.04, 0.95, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {withGrain && (
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
}
