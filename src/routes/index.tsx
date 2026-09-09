import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Sparkles, MessageCircle, Mic, Newspaper, CloudSun,
  Brain, Code2, Briefcase, Compass, Shield, Zap, Search, PenLine, Layers,
} from "lucide-react";
import { DepthSlabs } from "@/components/fx/DepthSlabs";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { CardSwap3D } from "@/components/fx/CardSwap3D";
import { Marquee3D } from "@/components/fx/Marquee3D";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { AuroraBars } from "@/components/fx/AuroraBars";
import { Dock, type DockItem } from "@/components/fx/Dock";
import { BlobCard } from "@/components/fx/BlobCard";
import { TextScroll3D } from "@/components/fx/TextScroll3D";
import { CursorTrail } from "@/components/fx/CursorTrail";
import {
  Float, PulseGlow, StaggerChildren, StaggerItem,
  BlurIn, BounceIn, ScaleHover, SlideIn, AnimatedCounter,
  TiltHover, GlowHover, RippleClick, AnimatedUnderline, ShimmerHover,
} from "@/components/fx/anim";
import { ScrollReveal, ParallaxLayer, MaskedTextReveal, ScrollTilt, ScrollScale } from "@/components/fx/scroll-anim";
import { ShowcaseCard } from "@/components/fx/ShowcaseCard";
import { BentoGrid, type BentoItem } from "@/components/fx/BentoGrid";
import { LogoCloud } from "@/components/fx/LogoCloud";
import { PremiumFooter } from "@/components/fx/PremiumFooter";
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

const STATS = [
  { value: 10, suffix: "K+", label: "Active users" },
  { value: 2, suffix: "M+", label: "Conversations" },
  { value: 99, suffix: ".9%", label: "Uptime" },
  { value: 150, suffix: "+", label: "Skills" },
];

const TESTIMONIALS = [
  { quote: "Folio replaced five tabs and three subscriptions. It's the first AI tool that actually feels calm.", author: "Maya Chen", role: "Product designer" },
  { quote: "The voice mode is unreal. I plan my entire morning by talking to it while making coffee.", author: "James Okafor", role: "Startup founder" },
  { quote: "It remembers my stack, my tone, my timezone. Every other assistant feels amnesiac by comparison.", author: "Sofía García", role: "Engineering lead" },
];

const SHOWCASE = [
  { title: "Weather Atlas", desc: "Live conditions, 7-day forecast, and animated cards for any city on Earth.", accent: "#4d9bff", icon: CloudSun, tags: ["Live data", "Animated cards"] },
  { title: "Research Brief", desc: "Folio browses 20+ sources and synthesises a sourced one-pager in 30 seconds.", accent: "#b66dff", icon: Search, tags: ["Web browsing", "Citations"] },
  { title: "Code Workbench", desc: "Read, write, and run your project files with an AI pair-programmer beside you.", accent: "#7dffb4", icon: Code2, tags: ["Editor", "AI pair-programmer"] },
  { title: "Voice Journal", desc: "Talk naturally — Folio transcribes, summarises, and files your thoughts automatically.", accent: "#ff4d8d", icon: Mic, tags: ["Voice", "Transcription"] },
  { title: "Draft Studio", desc: "Emails, one-pagers, and slide outlines tuned to your tone and audience.", accent: "#ffd24d", icon: PenLine, tags: ["Drafting", "Tone-aware"] },
  { title: "Memory Vault", desc: "Everything Folio knows about you — editable, exportable, yours alone.", accent: "#b66dff", icon: Brain, tags: ["Privacy", "Row-level security"] },
];

const LOGO_NAMES = [
  "Vercel", "Linear", "Notion", "Figma", "Stripe", "GitHub", "Framer", "Supabase",
];

const BENTO_ITEMS: BentoItem[] = [
  {
    size: "large",
    icon: Layers,
    title: "One calm place",
    desc: "Weather, news, research, code, drafts, and memory — all in a single, quiet workspace that remembers you.",
    accent: "#b66dff",
    visual: (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-foreground/5 border border-border/30 transition-colors group-hover:border-border/50" />
        ))}
      </div>
    ),
  },
  { size: "tall", icon: Brain, title: "Memory that remembers", desc: "Tell it once. Folio remembers your city, your tone, your stack — and quietly uses it forever.", accent: "#4d9bff" },
  { size: "wide", icon: Mic, title: "Voice that listens", desc: "Push to talk and the orb comes alive — reacting to your voice in real time.", accent: "#ff4d8d" },
  { size: "small", icon: CloudSun, title: "Weather", desc: "Live conditions, beautifully rendered.", accent: "#4d9bff" },
  { size: "small", icon: Newspaper, title: "News", desc: "Your topics, self-refreshing.", accent: "#ffd24d" },
  { size: "wide", icon: Compass, title: "Research with sources", desc: "Folio browses, reads, and synthesises — with citations, not guesses.", accent: "#7dffb4" },
];

const DOCK_ITEMS: DockItem[] = [
  { icon: <CloudSun className="h-5 w-5" />, label: "Weather", href: "#what" },
  { icon: <Newspaper className="h-5 w-5" />, label: "News", href: "#what" },
  { icon: <Brain className="h-5 w-5" />, label: "Memory", href: "#what" },
  { icon: <Code2 className="h-5 w-5" />, label: "Workbench", href: "#what" },
  { icon: <Mic className="h-5 w-5" />, label: "Voice", href: "#voice" },
  { icon: <Compass className="h-5 w-5" />, label: "Research", href: "#what" },
];

function Landing() {
  // Keeps the global 3D depth setting applied on the landing page too.
  const prefs = usePreferences();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: prefs.landing === "chat" ? "/chat" : "/dashboard" });
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
          "sticky top-0 z-50 transition-all duration-500",
          scrolled ? "backdrop-blur-xl bg-background/70 border-b border-border/60" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-serif text-2xl tracking-tight">Folio</Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#what" className="hover:text-foreground transition"><AnimatedUnderline>What it does</AnimatedUnderline></a>
            <a href="#skills" className="hover:text-foreground transition"><AnimatedUnderline>Skills</AnimatedUnderline></a>
            <a href="#showcase" className="hover:text-foreground transition"><AnimatedUnderline>Showcase</AnimatedUnderline></a>
            <a href="#voice" className="hover:text-foreground transition"><AnimatedUnderline>Voice</AnimatedUnderline></a>
            <a href="#faq" className="hover:text-foreground transition"><AnimatedUnderline>FAQ</AnimatedUnderline></a>
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
      <section className="relative min-h-[92vh] flex items-center">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <DepthSlabs layers={6} intensity={1} />
          <ParallaxLayer speed={0.08} className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[620px] w-[900px] rounded-full opacity-60 blur-3xl rgb-blob" />
          <div className="pointer-events-none absolute inset-0 bg-background/45 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">

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
            <div className="mx-auto mt-12 max-w-2xl">
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
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
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

      {/* ---------- trusted by (logo cloud) ---------- */}
      <section className="border-t border-border/60 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal direction="up">
            <p className="text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/50 mb-8">
              Trusted by teams at
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up">
            <LogoCloud names={LOGO_NAMES} speed={40} />
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- statement ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-4xl px-6 py-28 md:py-40">
          <ScrollReveal direction="up">
            <p className="font-serif text-3xl md:text-5xl leading-[1.25] tracking-tight">
              <MaskedTextReveal text="Most assistants give you text. Folio gives you something to use — a card, a component, a diagram, a draft, a decision." />
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- aurora bars (unlumen-inspired) ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <ScrollReveal direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground text-center">Quiet motion</p>
            <h2 className="font-serif text-3xl md:text-5xl mt-3 tracking-tight text-center">
              Calm on the surface, <em className="italic">alive underneath.</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="scale">
            <div className="mt-14 h-32 md:h-40">
              <AuroraBars barCount={32} speed={0.4} blur={2} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- stats (animated counters) ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" stagger={0.12}>
            {STATS.map((s) => (
              <StaggerItem key={s.label}>
                <BounceIn>
                  <div className="font-serif text-5xl md:text-6xl tracking-tight">
                      <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                </BounceIn>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ---------- capability bento ---------- */}
      <section id="what" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <ScrollReveal direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">What it does</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              Six things, done unusually well.
            </h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }, idx) => {
              const useBlob = idx === 0 || idx === 3;
              const dirs = ["up", "left", "right", "up", "left", "right"] as const;
              const card = useBlob ? (
                <BlobCard
                  className="h-full"
                  colors={idx === 0 ? ["#ff4d8d", "#b66dff", "#4d9bff"] : ["#7dffb4", "#ffd24d", "#ff4d8d"]}
                >
                  <Icon className="h-5 w-5 mb-5" />
                  <h3 className="font-serif text-2xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </BlobCard>
              ) : (
                <SpotlightCard className="h-full">
                  <Icon className="h-5 w-5 mb-5" />
                  <h3 className="font-serif text-2xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </SpotlightCard>
              );
              return (
                <ScrollReveal key={title} direction={dirs[idx]}>
                  {card}
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- card swap: a day with Folio ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <ParallaxLayer speed={0.15} className="pointer-events-none absolute right-[-10%] top-1/4 h-[420px] w-[520px] rounded-full rgb-blob opacity-25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-16 md:grid-cols-2 items-center">
          <ScrollReveal direction="left">
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
          </ScrollReveal>
          <ScrollReveal direction="right">
            <GlowHover color="rgba(182, 109, 255, 0.18)">
              <CardSwap3D items={DAY_CARDS} />
            </GlowHover>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- 3D scroll text (skiper-inspired) ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden bg-paper-dim/30">
        <TextScroll3D text="BUILT FOR YOUR DAY" />
      </section>

      {/* ---------- skills marquee ---------- */}
      <section id="skills" className="border-t border-border/60 bg-paper-dim/30 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <ScrollReveal direction="up">
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
          </ScrollReveal>
          <ScrollReveal direction="scale">
            <div className="mt-12 space-y-3">
              <Marquee3D items={SKILLS} speed={38} />
              <Marquee3D items={[...SKILLS].reverse()} speed={46} reverse />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- showcase (21st.dev-inspired interactive cards) ---------- */}
      <section id="showcase" className="relative border-t border-border/60 overflow-hidden">
        <ParallaxLayer speed={0.1} className="pointer-events-none absolute left-[-5%] top-1/3 h-[400px] w-[500px] rounded-full rgb-blob opacity-20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <ScrollReveal direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Showcase</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              Things Folio builds, <em className="italic">live.</em>
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
              Every output is a real, interactive surface — not a wall of text. Hover any card to
              see it react to your movement.
            </p>
          </ScrollReveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((item, idx) => {
              const dirs = ["up", "left", "right", "up", "left", "right"] as const;
              return (
                <ScrollReveal key={item.title} direction={dirs[idx]}>
                  <ShowcaseCard
                    title={item.title}
                    desc={item.desc}
                    tags={item.tags}
                    accent={item.accent}
                    icon={item.icon}
                    index={idx + 1}
                  />
                </ScrollReveal>
              );
            })}
          </div>
          <ScrollReveal direction="up">
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>Every card above is a real component Folio renders in conversation — not a screenshot.</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- bento grid (premium experience) ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <ParallaxLayer speed={0.08} className="pointer-events-none absolute right-[-5%] bottom-1/4 h-[400px] w-[500px] rounded-full rgb-blob opacity-15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <ScrollReveal direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">The experience</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              Everything, <em className="italic">in its place.</em>
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground leading-relaxed">
              One surface for your whole day — each piece crafted to feel calm, alive, and unmistakably yours.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up">
            <BentoGrid items={BENTO_ITEMS} className="mt-14" />
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- cursor trail (unlumen-inspired) ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <ScrollReveal direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground text-center">Interactive</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight text-center">
              Move your cursor.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed text-center">
              Folio responds to you — not just clicks, but motion. Every surface is alive.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="scale">
            <CursorTrail className="mt-12 h-64 rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm">
              <div className="grid h-full place-items-center text-muted-foreground/40 text-sm">
                Hover across this area
              </div>
            </CursorTrail>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- voice / orb ---------- */}
      <section id="voice" className="relative border-t border-border/60 overflow-hidden">
        <ParallaxLayer speed={0.12} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[720px] rounded-full rgb-blob opacity-35 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-40 grid gap-14 md:grid-cols-2 items-center">
          <ScrollReveal direction="left">
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
          </ScrollReveal>
          <ScrollReveal direction="right">
            <Float duration={7}>
              <PulseGlow color="rgba(182, 109, 255, 0.25)">
                <div className="relative aspect-square max-w-md mx-auto w-full rounded-3xl border border-border/60 bg-card/20 backdrop-blur-xl overflow-hidden">
                  <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="h-56 w-56 rgb-blob opacity-25 blur-3xl rounded-[2rem]" />
                  </div>
                  <div className="absolute inset-0 grid place-items-center">
                    <FolioMark className="h-56 w-56" />
                  </div>
                </div>
              </PulseGlow>
            </Float>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- testimonials (staggered) ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <SlideIn direction="up">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Loved by busy people</p>
            <h2 className="font-serif text-4xl md:text-6xl mt-3 tracking-tight">
              Quietly indispensable.
            </h2>
          </SlideIn>
          <StaggerChildren className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.15}>
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.author}>
                <TiltHover max={6} className="h-full">
                  <ShimmerHover className="h-full rounded-2xl border border-border/60 bg-card/45 backdrop-blur p-7">
                    <p className="text-base leading-relaxed">"{t.quote}"</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-foreground/15 to-foreground/5 grid place-items-center text-sm font-serif">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.author}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </ShimmerHover>
                </TiltHover>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ---------- workbench strip ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 grid gap-14 md:grid-cols-2 items-center">
          <ScrollTilt max={6} className="order-2 md:order-1">
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
          </ScrollTilt>
          <ScrollReveal direction="right" className="order-1 md:order-2">
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
          </ScrollReveal>
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section id="faq" className="border-t border-border/60">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <ScrollScale from={0.9} to={1}>
            <h2 className="font-serif text-4xl md:text-6xl tracking-tight">Questions.</h2>
          </ScrollScale>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {FAQ.map(({ q, a }, i) => (
              <ScrollReveal key={q} direction="up">
                <details className="group py-6">
                  <summary className="cursor-pointer list-none flex items-center gap-4">
                    <span className="font-serif text-xl md:text-2xl flex-1">{q}</span>
                    <span className="text-muted-foreground transition group-open:rotate-45 text-2xl leading-none">+</span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">{a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative border-t border-border/60 overflow-hidden">
        <ParallaxLayer speed={0.1} className="pointer-events-none absolute bottom-[-220px] left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full rgb-blob opacity-50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 py-32 md:py-44 text-center">
          <ScrollReveal direction="up">
            <h2 className="font-serif text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] tracking-tight">
              Stop juggling<br /><em className="italic">ten tabs.</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="scale">
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <MagneticButton strength={0.28}>
                <RippleClick className="rounded-full">
                  <ScaleHover scale={1.05}>
                    <Link
                      to="/login"
                      className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground transition hover:opacity-90"
                    >
                      Start chatting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </ScaleHover>
                </RippleClick>
              </MagneticButton>

              <a
                href="#what"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-7 py-3.5 transition hover:bg-foreground/5"
              >
                <MessageCircle className="h-4 w-4" /> See what it does
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <PremiumFooter />

      {/* ---------- floating dock (unlumen-inspired) ---------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Dock
          items={DOCK_ITEMS}
          iconSize={36}
          magnification={1.8}
          distance={80}
          className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl px-3 py-2 shadow-lg"
        />
      </div>
    </div>
  );
}
