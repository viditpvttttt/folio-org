import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Box, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-serif text-2xl tracking-tight">Folio</Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
          <a href="#philosophy" className="text-muted-foreground hover:text-foreground transition">Philosophy</a>
          <Link to="/login" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition">
            Open workspace
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-32 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
            A spatial workspace · in private beta
          </p>
          <h1 className="font-serif text-6xl md:text-8xl leading-[0.95] tracking-tight">
            Your thoughts,<br/>
            <em className="italic">floating in space.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Folio is what happens when you take pages, tasks and notes — and let them
            live in a calm 3D room instead of a sidebar. Less menus. More thinking.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground">
              Enter the workspace
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 hover:bg-secondary transition">
              See how it works
            </a>
          </div>

          <div className="mt-20 relative h-72 md:h-96">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="float-soft absolute left-1/4 top-6 h-40 w-32 -rotate-6 rounded-md bg-card border border-border shadow-xl p-3 text-left">
                <div className="text-[10px] text-muted-foreground">PAGE</div>
                <div className="font-serif text-lg mt-1">Morning pages</div>
                <div className="mt-2 space-y-1">
                  <div className="h-1 w-full bg-muted rounded" />
                  <div className="h-1 w-4/5 bg-muted rounded" />
                  <div className="h-1 w-3/5 bg-muted rounded" />
                </div>
              </div>
              <div className="float-soft absolute right-1/4 top-0 h-44 w-36 rotate-3 rounded-md bg-card border border-border shadow-xl p-3 text-left" style={{ animationDelay: '1s' }}>
                <div className="text-[10px] text-muted-foreground">TASK</div>
                <div className="font-serif text-lg mt-1">Ship v1</div>
                <div className="mt-3 flex gap-1">
                  <span className="text-[10px] rounded-full bg-foreground/10 px-2 py-0.5">doing</span>
                </div>
              </div>
              <div className="float-soft absolute left-1/2 -translate-x-1/2 bottom-0 h-36 w-44 -rotate-2 rounded-md bg-primary text-primary-foreground border border-border shadow-2xl p-3 text-left" style={{ animationDelay: '2s' }}>
                <div className="text-[10px] opacity-60">DASHBOARD</div>
                <div className="font-serif text-xl mt-1">This week</div>
                <div className="mt-2 text-xs opacity-80">3 pages · 7 tasks · 2 done</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-paper-dim/40">
          <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-3 gap-12">
            {[
              { icon: Box, title: "A room, not a sidebar", body: "Every page is an object you can pick up, arrange and group. Navigation becomes spatial memory." },
              { icon: Layers, title: "Blocks, but minimal", body: "Headings, text, lists, todos, dividers — the 90% you actually use, with none of the menu noise." },
              { icon: Sparkles, title: "Built for clarity", body: "Paper and ink, no purple gradients. Designed to disappear so the writing stays loud." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="h-5 w-5 mb-4" />
                <h3 className="font-serif text-2xl mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="philosophy" className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">
            Notion gave us blocks.<br/><em className="italic">We gave them space.</em>
          </h2>
          <p className="mt-6 text-muted-foreground">
            A workspace shouldn't feel like a filing cabinet. It should feel like a desk —
            with pages you can move, stack, and find by where you left them.
          </p>
          <Link to="/login" className="mt-10 inline-flex items-center gap-2 ink-underline text-sm">
            Start writing <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground flex justify-between">
          <span>Folio · A 3D workspace</span>
          <span>Made with care</span>
        </div>
      </footer>
    </div>
  );
}
