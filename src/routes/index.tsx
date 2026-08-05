import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Sparkles, Wand2, MessageCircle, Mic, Newspaper, CloudSun,
  Brain, Code2, Briefcase, Compass, Shield, Zap,
} from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Folio — the assistant that lives in one calm place" },
      {
        name: "description",
        content:
          "Folio is a 3D, voice-ready AI assistant for everyday life — weather, news, research, drafting, vibecoding and work, in one beautifully quiet workspace.",
      },
      { property: "og:title", content: "Folio — the assistant that lives in one calm place" },
      {
        property: "og:description",
        content: "Weather, news, research, drafting, vibecoding and work — one calm, 3D AI assistant.",
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
            <a href="#what" className="hover:text-foreground transition">What it does</a>
            <a href="#skills" className="hover:text-foreground transition">Skills</a>
            <a href="#voice" className="hover:text-foreground transition">Voice</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <Link
            to="/login"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <AmbientScene />
        </div>
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[620px] w-[900px] rounded-full opacity-60 blur-3xl rgb-blob -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-background/45 backdrop-blur-[2px]" />

        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <Reveal>
            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-8">
              A calmer kind of AI assistant
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-serif text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] tracking-tight">
              One assistant for<br />
              <em className="italic">your whole day.</em>
            </h1>
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

      {/* ---------- statement ---------- */}
      <section className="border-t border-border/60 bg-paper-dim/30">
        <div className="mx-auto max-w-4xl px-6 py-28 md:py-40">
          <Reveal>
            <p className="font-serif text-3xl md:text-5xl leading-[1.25] tracking-tight">
              Most assistants give you <span className="text-muted-foreground">text</span>.
              Folio gives you <em className="italic">something to use</em> — a card, a component,
              a diagram, a draft, a decision.
            </p>
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
                <div className="group relative h-full rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-7 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-border">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full rgb-blob opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-40" />
                  <Icon className="h-5 w-5 mb-5" />
                  <h3 className="font-serif text-2xl mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
            <div className="mt-12 flex flex-wrap gap-2.5">
              {SKILLS.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-sm text-foreground/80 transition hover:bg-foreground hover:text-background"
                >
                  {s}
                </span>
              ))}
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
            <div className="relative aspect-square max-w-md mx-auto w-full rounded-3xl border border-border/60 bg-card/30 backdrop-blur-xl overflow-hidden">
              <AmbientScene />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-40 w-40 rounded-full rgb-blob blur-xl opacity-80 animate-pulse" />
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
                <details className="group py-6">
                  <summary className="cursor-pointer list-none flex items-center gap-4">
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
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground transition hover:opacity-90"
              >
                Start chatting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
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
