import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Sparkles, Wand2, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Folio — your everyday AI assistant" },
      { name: "description", content: "Folio is a warm, beautiful AI assistant for everyday life — plan your day, draft anything, think out loud." },
    ],
  }),
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full opacity-50 blur-3xl rgb-blob" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-serif text-2xl tracking-tight">Folio</Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#what" className="text-muted-foreground hover:text-foreground transition">What it does</a>
          <Link to="/login" className="rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition">
            Start chatting
          </Link>
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-28 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
            A calmer kind of AI assistant
          </p>
          <h1 className="font-serif text-6xl md:text-8xl leading-[0.95] tracking-tight">
            One assistant for<br/>
            <em className="italic">your whole day.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Plan it. Draft it. Decide it. Talk it out. Folio is a warm, fast, beautifully simple
            AI that lives in one calm place — so you stop juggling ten tabs.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground">
              Start chatting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <section id="what" className="border-t border-border bg-paper-dim/40">
          <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-3 gap-12">
            {[
              { icon: MessageCircle, title: "Just talk", body: "Ask anything — no menus, no setup. Folio listens, thinks, and replies like a calm friend who happens to know a lot." },
              { icon: Wand2, title: "Draft & decide", body: "Write the email, plan the trip, summarize the doc, weigh the options. One place, no tab-switching." },
              { icon: Sparkles, title: "Beautiful by default", body: "Paper, ink, and a quiet RGB aurora. Built so you actually want to come back to it." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="h-5 w-5 mb-4" />
                <h3 className="font-serif text-2xl mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground flex justify-between">
          <span>Folio · everyday assistant</span>
          <span>Made with care</span>
        </div>
      </footer>
    </div>
  );
}
