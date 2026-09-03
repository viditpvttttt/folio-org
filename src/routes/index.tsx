import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Sparkles, Wand2, MessageCircle, Mic, Newspaper, CloudSun,
  Brain, Code2, Briefcase, Compass, Shield, Zap,
} from "lucide-react";
import { DepthSlabs } from "@/components/fx/DepthSlabs";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { CardSwap3D } from "@/components/fx/CardSwap3D";
import { Marquee3D } from "@/components/fx/Marquee3D";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { FolioMark } from "@/components/brand/FolioMark";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Folio — the assistant that lives in one calm place" },
      {
        name: "description",
        content:
          "Folio is a 3D, voice-ready AI assistant for everyday life — weather, news, research, drafting, research and work, in one beautifully quiet workspace.",
      },
      { property: "og:title", content: "Folio — the assistant that lives in one calm place" },
      {
        property: "og:description",
        content: "Weather, news, research, drafting, research and work — one calm, 3D AI assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ---------------- scroll reveal ---------------- */
function Reveal({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        shown ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-[6px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const ROTATING = [
  "plan my day around a 2pm flight",
  "what's the weather in Lisbon?",
  "summarise this 40-page PDF",
  "draft a polite follow-up email",
  "build me a pricing page, live",
  "explain diffusion models visually",
];

function RotatingPrompt() {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const full = ROTATING[i];
    let c = 0;
    const type = setInterval(() => {
      c++;
      setTyped(full.slice(0, c));
      if (c >= full.length) {
        clearInterval(type);
        setTimeout(() => setI((p) => (p + 1) % ROTATING.length), 2200);
      }
    }, 38);
    return () => clearInterval(type);
  }, [i]);
  return (
    <span className="whitespace-pre">
      {typed}
      <span className="inline-block w-[2px] h-[1em] align-middle bg-foreground/70 animate-pulse ml-0.5" />
    </span>
  );
}


const FIELD_NODES = [
  { x: 14, y: 30 }, { x: 29, y: 17 }, { x: 45, y: 25 },
  { x: 63, y: 14 }, { x: 80, y: 31 }, { x: 71, y: 50 },
  { x: 86, y: 68 }, { x: 60, y: 78 }, { x: 39, y: 67 },
  { x: 21, y: 79 }, { x: 31, y: 48 }, { x: 52, y: 47 },
];
const FIELD_EDGES = [[0, 1], [1, 2], [1, 10], [2, 3], [2, 11], [3, 4], [4, 5], [5, 6], [5, 7], [7, 8], [8, 9], [8, 10], [9, 10], [10, 11], [11, 7], [11, 5]];

function SubstrateField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 16;
      targetY = (event.clientY / window.innerHeight - 0.5) * -12;
    };
    const onLeave = () => { targetX = 0; targetY = 0; };
    const tick = () => {
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;
      el.style.setProperty("--field-x", currentX.toFixed(2) + "px");
      el.style.setProperty("--field-y", currentY.toFixed(2) + "px");
      el.style.setProperty("--field-rx", (currentY * 0.28).toFixed(2) + "deg");
      el.style.setProperty("--field-ry", (currentX * 0.28).toFixed(2) + "deg");
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="substrate-field">
      <div className="substrate-field__scene">
        <div className="substrate-field__halo" />
        <svg className="substrate-field__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {FIELD_EDGES.map(([from, to], index) => (
            <line
              key={index}
              className="substrate-field__line"
              x1={FIELD_NODES[from].x}
              y1={FIELD_NODES[from].y}
              x2={FIELD_NODES[to].x}
              y2={FIELD_NODES[to].y}
              style={{ animationDelay: index * 180 + "ms" }}
            />
          ))}
        </svg>
        {FIELD_NODES.map((node, index) => (
          <span
            key={index}
            className="substrate-field__node"
            style={{ left: node.x + "%", top: node.y + "%", animationDelay: index * 160 + "ms" }}
          >
            <span />
          </span>
        ))}
        <div className="substrate-field__core"><span /></div>
      </div>
    </div>
  );
}


function SplitNavLink({ href, label }: { href: string; label: string }) {
  const letters = label.split("");
  return (
    <a href={href} className="split-link group relative text-sm text-muted-foreground transition-colors hover:text-foreground">
      <span className="split-link__viewport" aria-hidden="true">
        <span className="split-link__row">
          {letters.map((letter, index) => (
            <span key={letter + "-top-" + index} className="split-link__letter" style={{ transitionDelay: index * 18 + "ms" }}>
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
        <span className="split-link__row split-link__row--next">
          {letters.map((letter, index) => (
            <span key={letter + "-next-" + index} className="split-link__letter" style={{ transitionDelay: index * 18 + "ms" }}>
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
      </span>
      <span className="split-link__line" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </a>
  );
}

function BoxReveal({
  children,
  delay = 0,
}: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("box-reveal", shown && "box-reveal--shown")} style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

const CAPABILITIES = [
  { icon: CloudSun, title: "Weather, properly", body: "Live conditions for anywhere, rendered as a card you actually want to look at — not a paragraph of numbers." },
  { icon: Newspaper, title: "News you choose", body: "Pick your own topics — from “world” to “formula 1” — and Folio keeps a quiet, self-refreshing feed." },
  { icon: Brain, title: "Memory that sticks", body: "Tell it once. Folio remembers your city, your tone, your stack, and quietly uses it forever." },
  { icon: Code2, title: "Workbench", body: "A real editor, your files, and an AI pair-programmer that reads and writes them while you talk to it." },
  { icon: Briefcase, title: "Work mode", body: "Meeting prep, standups, one-pagers, slide outlines and email drafts, tuned for people with calendars." },
  { icon: Compass, title: "Deep research", body: "It browses, reads and synthesises — with sources — instead of guessing from last year's training data." },
];

const DAY_CARDS = [
  { tag: "07:10", title: "The morning read", body: "Weather where you actually are, your topics in the news, and anything you asked Folio to remember for today." },
  { tag: "11:30", title: "Deep work", body: "Draft the email, refine the doc, run the snippet, explain the paper — without leaving one calm surface." },
  { tag: "15:45", title: "Research sprint", body: "Folio browses, reads and synthesises with sources, then hands you a one-pager you can send." },
  { tag: "21:00", title: "Wind down", body: "Tomorrow's plan, reminders set, notes filed. Everything stays in your account, only yours." },
];

const SKILLS = [
  "Weather", "News", "Translate", "Currency", "Dictionary", "Recipes", "Palettes",
  "Passwords", "QR codes", "Web reader", "Image generation", "Code execution",
  "Deep research", "Reminders", "Unit conversion", "Explainers", "Voice",
];

const FAQ = [
  { q: "Is Folio just another chat box?", a: "No. Everything Folio does renders as something you can use — a weather card, a live component, a diagram, a draft. Chat is the interface, not the output." },
  { q: "Does it remember me?", a: "Yes, if you want it to. Facts, preferences and your project stack live in a memory you can read, edit and wipe from Settings." },
  { q: "Can I talk to it?", a: "Push to talk and Folio talks back. The orb reacts to your voice in real time — listening, thinking, speaking." },
  { q: "Is my data private?", a: "Your threads and memories are yours, scoped to your account with row-level security. Delete a memory and it's gone." },
];

function Landing() {
  // Keeps the global 3D depth setting applied on the landing page too.
  usePreferences();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain relative overflow-x-hidden">
      <ScrollProgress />
      <CursorGlow />

      {/* ---------- nav ---------- */}
      <header
        className={cn(
          "landing-header sticky top-0 z-50 transition-all duration-500",
          scrolled ? "landing-header--scrolled" : "",
        )}
      >
        <div className="landing-header__inner mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-serif text-2xl tracking-tight">Folio</Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <SplitNavLink href="#what" label="What it does" />
            <SplitNavLink href="#skills" label="Skills" />
            <SplitNavLink href="#voice" label="Voice" />
            <SplitNavLink href="#faq" label="FAQ" />
          </nav>
          <MagneticButton strength={0.3}>
            <Link
              to="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
            >
              Start free
            </Link>
          </MagneticButton>

        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="hero-section relative min-h-[92vh] flex items-center">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <DepthSlabs layers={6} intensity={1} />
           <SubstrateField />
          <div className="spectral-field spectral-field--folio" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[620px] w-[900px] rounded-full opacity-60 blur-3xl rgb-blob" />
          <div className="pointer-events-none absolute inset-0 bg-background/45 backdrop-blur-[2px]" />
        </div>

        <div className="hero-copy relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">

          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-8">
              A calmer kind of AI assistant
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[820px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full rgb-blob opacity-45 blur-[90px]"
              />
              <h1 className="relative font-serif text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] tracking-tight">
                One assistant for<br />
                <em className="italic">your whole day.</em>
              </h1>
            </div>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Weather, news, research, drafting, code and work — folded into one quiet,
              three-dimensional place that remembers you.
            </p>
          </Reveal>

          {/* fake composer */}
          <Reveal delay={240}>
            <div className="hero-composer gradient-border mx-auto mt-12 max-w-2xl">
              <div className="relative rounded-2xl p-[1.5px] overflow-hidden">
                <div className="absolute inset-0 rgb-blob opacity-70 blur-[10px]" />
                <div className="relative rounded-2xl bg-background/85 backdrop-blur-xl border border-border/50 px-5 py-4 flex items-center gap-3 text-left">
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-[15px] text-foreground/80">
                    <RotatingPrompt />
                  </span>
                  <Link
                    to="/login"
                    className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90 transition"
                    aria-label="Start chatting"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="hero-badges mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                {["No setup", "Voice built in", "Remembers you", "Free to start"].map((t) => (
                  <span key={t} className="rounded-full border border-border/60 bg-background/50 px-3 py-1">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- statement ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-4xl px-6 py-28 md:py-40">
          <Reveal>
            <BoxReveal>
              <p className="font-serif text-3xl md:text-5xl leading-[1.25] tracking-tight">
                Most assistants give you <span className="text-muted-foreground">text</span>.
                Folio gives you <em className="italic">something to use</em> — a card, a component,
                a diagram, a draft, a decision.
              </p>
            </BoxReveal>
          </Reveal>
        </div>
      </section>

      {/* ---------- capability bento ---------- */}
      <section id="what" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">What it does</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              Six things, done unusually well.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }, idx) => (
              <Reveal key={title} delay={idx * 70}>
                <SpotlightCard className="capability-card tile-aurora h-full">
                  <div className="capability-card__icon"><Icon className="h-5 w-5" /></div>
                  <h3 className="font-serif text-2xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- card swap: a day with Folio ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <div className="pointer-events-none absolute right-[-10%] top-1/4 h-[420px] w-[520px] rounded-full rgb-blob opacity-25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-16 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">A day with Folio</p>
              <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight leading-[1.02]">
                <ScrambleText text="Morning to midnight." />
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
                One place that moves with your day. Hover the stack to pause it, click to flip
                through — it's the same rhythm Folio follows for you.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <CardSwap3D items={DAY_CARDS} className="sticky-card-stack" />
          </Reveal>
        </div>
      </section>

      {/* ---------- skills marquee ---------- */}
      <section id="skills" className="border-t border-border/60 bg-paper-dim/30 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Skills</p>
                <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
                  It brought tools.
                </h2>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                Folio picks the right tool on its own — you never choose a mode, a tab, or a plugin.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12 space-y-3">
              <Marquee3D items={SKILLS} speed={38} />
              <Marquee3D items={[...SKILLS].reverse()} speed={46} reverse />
            </div>
          </Reveal>
        </div>
      </section>



      {/* ---------- voice / orb ---------- */}
      <section id="voice" className="relative border-t border-border/60 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[720px] rounded-full rgb-blob opacity-35 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-40 grid gap-14 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Voice</p>
              <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight leading-[1.02]">
                Talk to it.<br /><em className="italic">Watch it think.</em>
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
                Hold to speak and the orb comes alive — a silk-shaded sphere that reacts to your
                voice, swirls while it reasons, and breathes while it answers. Tune the fluidity and
                damping yourself.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: Mic, t: "Push to talk" },
                  { icon: Zap, t: "Real-time reaction" },
                  { icon: Shield, t: "Your audio, your account" },
                ].map(({ icon: Icon, t }) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs"
                  >
                    <Icon className="h-3.5 w-3.5" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="relative aspect-square max-w-md mx-auto w-full rounded-3xl border border-border/60 bg-card/20 backdrop-blur-xl overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-56 w-56 rgb-blob opacity-25 blur-3xl rounded-[2rem]" />
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <FolioMark className="h-56 w-56" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- workbench strip ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-14 md:grid-cols-2 items-center">
          <Reveal className="order-2 md:order-1">
            <div className="rounded-2xl border border-border/60 bg-[#0b0b12] p-5 font-mono text-[12px] leading-relaxed text-emerald-200/90 shadow-xl overflow-hidden">
              <div className="flex gap-1.5 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <pre className="whitespace-pre-wrap">{`> read src/pricing.tsx
> "add a yearly toggle, keep the spacing"

✓ wrote src/pricing.tsx (+34 −6)
✓ ran tests — 12 passing`}</pre>
            </div>
          </Reveal>
          <Reveal delay={120} className="order-1 md:order-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Workbench</p>
              <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight leading-[1.02]">
                Say it.<br /><em className="italic">It edits.</em>
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
                Your projects and files live in Folio with a real editor beside an AI pair-programmer
                that can read, write and run them — no copy-pasting between tabs.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section id="faq" className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <Reveal>
            <h2 className="font-serif text-4xl md:text-6xl tracking-tight">Questions.</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="faq-item group py-6">
                  <summary className="faq-summary cursor-pointer list-none flex items-center gap-4">
                    <span className="font-serif text-xl md:text-2xl flex-1">{q}</span>
                    <span className="text-muted-foreground transition group-open:rotate-45 text-2xl leading-none">+</span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <div className="pointer-events-none absolute bottom-[-220px] left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full rgb-blob opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-32 md:py-44 text-center">
          <Reveal>
            <h2 className="font-serif text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] tracking-tight">
              Stop juggling<br /><em className="italic">ten tabs.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <MagneticButton strength={0.28}>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground transition hover:opacity-90"
                >
                  Start chatting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </MagneticButton>

              <a
                href="#what"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-7 py-3.5 transition hover:bg-foreground/5"
              >
                <MessageCircle className="h-4 w-4" /> See what it does
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5" /> Folio · everyday assistant
          </span>
          <span>Made with care</span>
        </div>
      </footer>
    </div>
  );
}
