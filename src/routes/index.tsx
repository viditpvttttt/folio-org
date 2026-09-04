import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  MessageCircle,
  Mic,
  Newspaper,
  CloudSun,
  Brain,
  Code2,
  Briefcase,
  Compass,
  Shield,
  Zap,
} from "lucide-react";
import { SpectralField } from "@/components/fx/SpectralField";
import { KineticText } from "@/components/fx/KineticText";
import { WordReveal } from "@/components/fx/WordReveal";
import { BoxReveal } from "@/components/fx/BoxReveal";
import { TiltAuroraCard } from "@/components/fx/TiltAuroraCard";
import { StickyCards, type StickyCardItem } from "@/components/fx/StickyCards";
import { ScrollDrawCurve } from "@/components/fx/ScrollDrawCurve";
import { Counter } from "@/components/fx/Counter";
import { IndexPreviewList, type IndexItem } from "@/components/fx/IndexPreviewList";
import { ButtonShine } from "@/components/fx/ButtonShine";
import { SubstrateMarquee } from "@/components/fx/SubstrateMarquee";
import { AmbientOrb3D } from "@/components/3d/AmbientOrb3D";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { CardSwap3D } from "@/components/fx/CardSwap3D";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Substrate — Kernel, VOID & Folio" },
      {
        name: "description",
        content:
          "Substrate is a research and product studio building Kernel, a multimodal LLM, VOID, a minimalist browser, and Folio, a quiet operating surface for your day.",
      },
      { property: "og:title", content: "Substrate — Kernel, VOID & Folio" },
      {
        property: "og:description",
        content:
          "A research and product studio for the ambient computer: a multimodal model, a browser, and the surface you work on.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ---------------- scroll reveal ---------------- */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
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
        shown
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-8 blur-[6px]",
        className
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

const MARQUEE_ITEMS = [
  "Multimodal",
  "Local-first",
  "One runtime",
  "Shared memory",
  "Long context",
  "Ambient computing",
  "No translators",
  "One representation",
];

const STICKY_CARDS_DATA: StickyCardItem[] = [
  {
    number: "01",
    badge: "Kernel",
    title: "The model underneath",
    subtitle: "In training",
    description:
      "Text, images, audio and video projected into one representation — a single attention pass instead of a stack of adapters.",
    actionText: "Read more",
    actionHref: "/login",
    tileA: "#c88bd9",
    tileB: "#7b6bd6",
    tileC: "#e0574a",
  },
  {
    number: "02",
    badge: "VOID Browser",
    title: "The window onto it",
    subtitle: "Pre-production",
    description:
      "A browser with nothing in the way: the page, the model and your intent share one quiet, uninterrupted surface.",
    actionText: "Read more",
    actionHref: "/login",
    tileA: "#7fa8c9",
    tileB: "#3d5a73",
    tileC: "#d97c3b",
  },
  {
    number: "03",
    badge: "Folio",
    title: "The surface you live on",
    subtitle: "Private beta",
    description:
      "Weather, files, memory and agents arranged on one canvas — an operating surface that recedes when it has nothing to say.",
    actionText: "Read more",
    actionHref: "/login",
    tileA: "#b8cdd9",
    tileB: "#5f8c6a",
    tileC: "#2f5e40",
  },
];

const INDEX_ITEMS: IndexItem[] = [
  {
    id: "kernel",
    number: "01",
    title: "Kernel",
    description: "The model underneath",
    category: "Foundation Model",
    href: "/login",
    previewGradient: "linear-gradient(135deg, #c88bd9, #7b6bd6, #e0574a)",
    previewDetails: ["Multimodal", "Single pass", "1M+ tokens", "Audio/Vision native"],
  },
  {
    id: "void",
    number: "02",
    title: "VOID Browser",
    description: "The window onto it",
    category: "Minimal Browser",
    href: "/login",
    previewGradient: "linear-gradient(135deg, #7fa8c9, #3d5a73, #d97c3b)",
    previewDetails: ["Zero chrome", "Model integrated", "Local execution", "Instant intent"],
  },
  {
    id: "folio",
    number: "03",
    title: "Folio",
    description: "The surface you live on",
    category: "Operating Canvas",
    href: "/login",
    previewGradient: "linear-gradient(135deg, #b8cdd9, #5f8c6a, #2f5e40)",
    previewDetails: ["Weather & News", "Real Workbench", "Silk 3D Orb", "Durable Memory"],
  },
  {
    id: "studio",
    number: "04",
    title: "Studio",
    description: "Research & Systems",
    category: "Laboratory",
    href: "/login",
    previewGradient: "linear-gradient(135deg, #7b6bd6, #e5a742, #5f8c6a)",
    previewDetails: ["Ambient computing", "Runtimes", "Evals", "Publications"],
  },
];

const CAPABILITIES = [
  {
    icon: CloudSun,
    title: "Weather, properly",
    body: "Live conditions for anywhere, rendered as a card you actually want to look at — not a paragraph of numbers.",
  },
  {
    icon: Newspaper,
    title: "News you choose",
    body: "Pick your own topics — from “world” to “formula 1” — and Folio keeps a quiet, self-refreshing feed.",
  },
  {
    icon: Brain,
    title: "Memory that sticks",
    body: "Tell it once. Folio remembers your city, your tone, your stack, and quietly uses it forever.",
  },
  {
    icon: Code2,
    title: "Workbench",
    body: "A real editor, your files, and an AI pair-programmer that reads and writes them while you talk to it.",
  },
  {
    icon: Briefcase,
    title: "Work mode",
    body: "Meeting prep, standups, one-pagers, slide outlines and email drafts, tuned for people with calendars.",
  },
  {
    icon: Compass,
    title: "Deep research",
    body: "It browses, reads and synthesises — with sources — instead of guessing from last year's training data.",
  },
];

const DAY_CARDS = [
  {
    tag: "07:10",
    title: "The morning read",
    body: "Weather where you actually are, your topics in the news, and anything you asked Folio to remember for today.",
  },
  {
    tag: "11:30",
    title: "Deep work",
    body: "Draft the email, refine the doc, run the snippet, explain the paper — without leaving one calm surface.",
  },
  {
    tag: "15:45",
    title: "Research sprint",
    body: "Folio browses, reads and synthesises with sources, then hands you a one-pager you can send.",
  },
  {
    tag: "21:00",
    title: "Wind down",
    body: "Tomorrow's plan, reminders set, notes filed. Everything stays in your account, only yours.",
  },
];

const SKILLS = [
  "Weather",
  "News",
  "Translate",
  "Currency",
  "Dictionary",
  "Recipes",
  "Palettes",
  "Passwords",
  "QR codes",
  "Web reader",
  "Image generation",
  "Code execution",
  "Deep research",
  "Reminders",
  "Unit conversion",
  "Explainers",
  "Voice",
];

const FAQ = [
  {
    q: "Is Folio just another chat box?",
    a: "No. Everything Folio does renders as something you can use — a weather card, a live component, a diagram, a draft. Chat is the interface, not the output.",
  },
  {
    q: "Does it remember me?",
    a: "Yes, if you want it to. Facts, preferences and your project stack live in a memory you can read, edit and wipe from Settings.",
  },
  {
    q: "Can I talk to it?",
    a: "Push to talk and Folio talks back. The 3D orb reacts to your voice in real time — listening, thinking, speaking with fluid physics.",
  },
  {
    q: "Is my data private?",
    a: "Your threads and memories are yours, scoped to your account with row-level security. Delete a memory and it's gone.",
  },
];

function Landing() {
  usePreferences();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [orbHovered, setOrbHovered] = useState(false);

  // Top bar scroll indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground paper-grain overflow-x-hidden">
      {/* Dynamic Spectral Scroll Progress Bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-[var(--spectral-b,#7b6bd6)] via-[var(--spectral-r,#e0574a)] to-[var(--spectral-g,#5f8c6a)]"
        style={{ scaleX }}
      />

      <ScrollProgress />
      <CursorGlow />

      {/* ---------- Header Navigation with Kinetic Character Roll-Up ---------- */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-[var(--spectral-b,#7b6bd6)]/35 to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--clay,#c47857)]" />
            <span className="rule-label !text-foreground font-semibold">Substrate</span>
          </Link>

          <nav className="flex items-center gap-6 sm:gap-9">
            <a
              href="#products"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <KineticText text="Kernel" />
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </a>

            <a
              href="#products"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <KineticText text="VOID" />
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </a>

            <a
              href="#what"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <KineticText text="Folio" />
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </a>

            <a
              href="#index"
              className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <KineticText text="Studio" />
              <span
                className="absolute -bottom-1 left-0 h-px w-0 bg-foreground transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ButtonShine href="/login" className="px-5 py-2 text-xs">
              Start free
            </ButtonShine>
          </div>
        </div>
      </header>

      {/* ---------- Hero Section with Ambient Spectral Field & Word Reveal ---------- */}
      <section className="relative isolate min-h-[90svh] flex items-center justify-center overflow-hidden pt-12 pb-20">
        <SpectralField intensity="soft" />
        <div className="hero-cloudscape" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Eyebrow badge */}
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[var(--clay,#c47857)] animate-pulse" />
              <span className="rule-label">The layer underneath</span>
            </div>
          </Reveal>

          {/* Main Headline with Word Reveal */}
          <div className="mt-2">
            <h1 className="text-display font-serif text-[clamp(2.8rem,7.5vw,6rem)] leading-[0.96] tracking-tight text-foreground">
              <WordReveal text="We build the ground" delay={0.1} />
              <br />
              <em className="italic">
                <WordReveal text="software grows on." delay={0.25} />
              </em>
            </h1>
          </div>

          <Reveal delay={180}>
            <p className="mx-auto mt-7 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              A research and product studio for the ambient computer — one substrate under{" "}
              <span className="text-foreground font-medium">Kernel, the model</span>,{" "}
              <span className="text-foreground font-medium">VOID, the browser</span>, and{" "}
              <span className="text-foreground font-medium">Folio, the quiet surface</span>.
            </p>
          </Reveal>

          {/* Interactive Hero Action Composer */}
          <Reveal delay={240}>
            <div className="mx-auto mt-10 max-w-xl">
              <div className="relative rounded-2xl p-[1.5px] overflow-hidden">
                <div className="absolute inset-0 rgb-blob opacity-60 blur-[10px]" />
                <div className="relative rounded-2xl bg-background/85 backdrop-blur-xl border border-border/50 px-5 py-3.5 flex items-center gap-3 text-left shadow-lg">
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm text-foreground/80 font-sans">
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

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <ButtonShine href="/login">Meet Kernel</ButtonShine>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur-md transition-all hover:bg-accent"
                >
                  <span>VOID Browser</span>
                  <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <div className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-muted-foreground">
            Scroll
          </div>
        </div>
      </section>

      {/* ---------- Dual-Track Infinite Marquee Ticker ---------- */}
      <section className="overflow-hidden border-y border-border/70 bg-card/50 py-3.5">
        <SubstrateMarquee items={MARQUEE_ITEMS} />
        <div className="mt-2.5">
          <SubstrateMarquee items={[...MARQUEE_ITEMS].reverse()} reverse />
        </div>
      </section>

      {/* ---------- Three Products: 3D Tilt Aurora Cards ---------- */}
      <section id="products" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <p className="rule-label">Three products</p>
          <h2 className="mt-4 max-w-xl text-4xl leading-tight text-foreground sm:text-5xl font-serif">
            <BoxReveal boxColor="var(--clay,#c47857)">
              <span>One substrate, three surfaces</span>
            </BoxReveal>
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STICKY_CARDS_DATA.map((prod, idx) => (
            <Reveal key={prod.number} delay={idx * 80}>
              <div className="aspect-[4/5] h-full">
                <TiltAuroraCard
                  tileA={prod.tileA}
                  tileB={prod.tileB}
                  tileC={prod.tileC}
                  href={prod.actionHref}
                >
                  <div className="flex items-center justify-between">
                    <p className="rule-label !text-white/90">{prod.badge}</p>
                    <span className="rounded-full border border-white/40 px-2.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-white/85">
                      {prod.subtitle}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl leading-snug text-white drop-shadow-sm font-display">
                      {prod.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/85 font-sans">
                      {prod.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm text-white font-medium">
                      Read more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </TiltAuroraCard>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Animated Metric Stat Counters ---------- */}
      <section className="border-y border-border/70 bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border/60 lg:grid-cols-4">
          <div className="bg-card/80 px-6 py-12 text-center">
            <p className="font-serif text-5xl sm:text-6xl font-light text-foreground">
              <Counter value={1} />
            </p>
            <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Context, all modalities
            </p>
          </div>

          <div className="bg-card/80 px-6 py-12 text-center">
            <p className="font-serif text-5xl sm:text-6xl font-light text-foreground">
              <Counter value={1} />
            </p>
            <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Runtime under everything
            </p>
          </div>

          <div className="bg-card/80 px-6 py-12 text-center">
            <p className="font-serif text-5xl sm:text-6xl font-light text-foreground">
              <Counter value={3} />
            </p>
            <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Surfaces on the substrate
            </p>
          </div>

          <div className="bg-card/80 px-6 py-12 text-center">
            <p className="font-serif text-5xl sm:text-6xl font-light text-foreground">
              <Counter value={0} />
            </p>
            <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              Translators in between
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Dynamic Scroll SVG Draw Curve & Editorial Quote ---------- */}
      <ScrollDrawCurve />

      {/* ---------- 3D Sticky Stacking Cards Section ---------- */}
      <section className="relative border-t border-border/70">
        <div className="mx-auto max-w-5xl px-6 pt-24 sm:pt-28">
          <Reveal>
            <p className="rule-label">One substrate</p>
            <h2 className="mt-4 max-w-xl text-4xl leading-tight text-foreground sm:text-5xl font-serif">
              <BoxReveal boxColor="var(--clay,#c47857)">
                <span>Three products, one shared ground</span>
              </BoxReveal>
            </h2>
          </Reveal>
        </div>

        <div className="mt-6">
          <StickyCards cards={STICKY_CARDS_DATA} />
        </div>
      </section>

      {/* ---------- Interactive 3D Voice Orb Canvas Section ---------- */}
      <section id="voice" className="relative border-t border-border/70 overflow-hidden py-24 sm:py-36">
        <SpectralField intensity="soft" />
        <div className="relative mx-auto max-w-6xl px-6 grid gap-14 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <p className="rule-label">Voice & 3D Intelligence</p>
              <h2 className="font-serif text-4xl sm:text-6xl mt-4 tracking-tight leading-[1.02]">
                Talk to it.<br />
                <em className="italic">Watch it think.</em>
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed">
                Hold to speak and the orb comes alive — a silk-shaded 3D sphere that reacts to
                your voice, swirls while it reasons, and breathes while it answers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: Mic, t: "Push to talk" },
                  { icon: Zap, t: "Real-time reaction" },
                  { icon: Shield, t: "Your audio, your account" },
                ].map(({ icon: Icon, t }) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 text-xs font-mono text-muted-foreground backdrop-blur-md"
                  >
                    <Icon className="h-3.5 w-3.5 text-foreground" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* WebGL 3D Canvas Orb */}
          <Reveal delay={140}>
            <div
              onMouseEnter={() => setOrbHovered(true)}
              onMouseLeave={() => setOrbHovered(false)}
              className="relative aspect-square max-w-md mx-auto w-full rounded-3xl border border-border/60 bg-card/20 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-foreground/30"
            >
              <AmbientOrb3D isHovered={orbHovered} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Capability Bento Section ---------- */}
      <section id="what" className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Reveal>
            <p className="rule-label">Capabilities</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              <BoxReveal boxColor="var(--clay,#c47857)">
                <span>Six things, done unusually well.</span>
              </BoxReveal>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }, idx) => (
              <Reveal key={title} delay={idx * 60}>
                <SpotlightCard className="h-full">
                  <Icon className="h-5 w-5 mb-5 text-[var(--clay,#c47857)]" />
                  <h3 className="font-serif text-2xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-sans">{body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Card Swap: A Day with Folio ---------- */}
      <section className="relative border-t border-border/70 overflow-hidden">
        <div className="pointer-events-none absolute right-[-10%] top-1/4 h-[420px] w-[520px] rounded-full rgb-blob opacity-25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-16 md:grid-cols-2 items-center">
          <Reveal>
            <div>
              <p className="rule-label">A day with Folio</p>
              <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight leading-[1.02]">
                <ScrambleText text="Morning to midnight." />
              </h2>
              <p className="mt-6 max-w-md text-muted-foreground leading-relaxed font-sans">
                One place that moves with your day. Hover the stack to pause it, click to flip
                through — it's the same rhythm Folio follows for you.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <CardSwap3D items={DAY_CARDS} />
          </Reveal>
        </div>
      </section>

      {/* ---------- Interactive Index / Directory List with Floating Preview ---------- */}
      <section id="index" className="border-t border-border/70">
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
          <Reveal>
            <p className="rule-label">Index</p>
            <h2 className="mt-4 max-w-xl text-4xl leading-tight text-foreground sm:text-5xl font-serif">
              <BoxReveal boxColor="var(--clay,#c47857)">
                <span>Everything on the substrate</span>
              </BoxReveal>
            </h2>
          </Reveal>

          <div className="mt-12">
            <IndexPreviewList items={INDEX_ITEMS} />
          </div>
        </div>
      </section>

      {/* ---------- FAQ Section ---------- */}
      <section id="faq" className="border-t border-border/70">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <Reveal>
            <h2 className="font-serif text-4xl md:text-6xl tracking-tight">Questions.</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="group py-6">
                  <summary className="cursor-pointer list-none flex items-center gap-4">
                    <span className="font-serif text-xl md:text-2xl flex-1">{q}</span>
                    <span className="text-muted-foreground transition group-open:rotate-45 text-2xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed font-sans">
                    {a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA / Early Access Section with ButtonShine ---------- */}
      <section className="relative isolate overflow-hidden border-t border-border/70 py-28 sm:py-36 text-center">
        <SpectralField intensity="soft" />
        <div className="relative mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="font-serif text-4xl sm:text-6xl tracking-tight">
              Early, and open to company
            </h2>
            <p className="mx-auto mt-6 max-w-md text-base sm:text-lg text-muted-foreground leading-relaxed font-sans">
              If you are building at the same layer — models, runtimes, browsers — we would like to
              hear from you.
            </p>
            <div className="mt-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate({ to: "/login" });
                }}
                className="mx-auto flex max-w-md items-center gap-3"
              >
                <div className="relative flex-1 rounded-full">
                  <input
                    type="email"
                    required
                    placeholder="you@work.dev"
                    className="w-full rounded-full bg-card/80 border border-border/70 px-6 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 backdrop-blur-md focus:border-foreground transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-shine relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  aria-label="Get in touch"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Footer with Spectral Base Gradient ---------- */}
      <footer className="relative isolate overflow-hidden border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[var(--clay,#c47857)]" />
            <p className="rule-label !text-foreground font-semibold">Substrate</p>
          </div>
          <nav className="flex flex-wrap gap-6">
            <a
              href="#products"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-sans"
            >
              Kernel
            </a>
            <a
              href="#products"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-sans"
            >
              VOID
            </a>
            <a
              href="#what"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-sans"
            >
              Folio
            </a>
            <a
              href="#index"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground font-sans"
            >
              Studio
            </a>
          </nav>
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 Substrate. Kernel · VOID · Folio
          </p>
        </div>
        <div className="spectral-base" aria-hidden="true" />
      </footer>
    </div>
  );
}
