import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltAuroraCardProps {
  children: React.ReactNode;
  className?: string;
  tileA?: string;
  tileB?: string;
  tileC?: string;
  perspective?: number;
  maxAngle?: number;
  href?: string;
  as?: "div" | "a";
}

/**
 * 3D Tilt Aurora Card with dynamic mesh lighting and pointer parallax.
 * Directly implements the 3D perspective cards featured on substrate-devs and skiper-ui.
 */
export function TiltAuroraCard({
  children,
  className,
  tileA = "#c88bd9",
  tileB = "#7b6bd6",
  tileC = "#e0574a",
  perspective = 900,
  maxAngle = 12,
  href,
}: TiltAuroraCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Raw normalized mouse coordinates (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for rotation
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxAngle, -maxAngle]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxAngle, maxAngle]), springConfig);

  // Glare position
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => {
    setHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const CardWrapper = href ? "a" : "div";

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
      }}
      className="relative h-full w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="h-full w-full rounded-3xl transition-shadow duration-300"
      >
        {href ? (
          <a
            href={href}
            style={
              {
                "--tile-a": tileA,
                "--tile-b": tileB,
                "--tile-c": tileC,
              } as React.CSSProperties
            }
            className={cn(
              "tile-aurora group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg transition-all duration-500 hover:shadow-2xl",
              className
            )}
          >
            {hovered && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay opacity-35 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                }}
              />
            )}
            <div
              style={{ transform: "translateZ(24px)", transformStyle: "preserve-3d" }}
              className="relative z-10 flex h-full flex-col justify-between"
            >
              {children}
            </div>
          </a>
        ) : (
          <div
            style={
              {
                "--tile-a": tileA,
                "--tile-b": tileB,
                "--tile-c": tileC,
              } as React.CSSProperties
            }
            className={cn(
              "tile-aurora group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg transition-all duration-500 hover:shadow-2xl",
              className
            )}
          >
            {hovered && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay opacity-35 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                }}
              />
            )}
            <div
              style={{ transform: "translateZ(24px)", transformStyle: "preserve-3d" }}
              className="relative z-10 flex h-full flex-col justify-between"
            >
              {children}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
