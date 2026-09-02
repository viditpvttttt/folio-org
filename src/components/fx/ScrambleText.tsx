import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz/\\|<>*#$%";

/** Unlumen-style text scramble that resolves when scrolled into view or hovered. */
export function ScrambleText({
  text,
  className,
  speed = 28,
  trigger = "view",
}: {
  text: string;
  className?: string;
  speed?: number;
  trigger?: "view" | "hover" | "mount";
}) {
  const [out, setOut] = useState(trigger === "mount" ? "" : text);
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef<number | null>(null);

  const run = () => {
    if (raf.current) window.clearInterval(raf.current);
    let frame = 0;
    const id = window.setInterval(() => {
      frame++;
      const revealed = Math.floor(frame / 2);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < revealed) return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (revealed >= text.length) window.clearInterval(id);
    }, speed);
    raf.current = id;
  };

  useEffect(() => {
    if (trigger === "mount") { run(); return () => { if (raf.current) window.clearInterval(raf.current); }; }
    if (trigger !== "view") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); if (raf.current) window.clearInterval(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, trigger]);

  return (
    <span
      ref={ref}
      onMouseEnter={trigger === "hover" ? run : undefined}
      className={cn(className)}
    >
      {out}
    </span>
  );
}
