import { FolioMark } from "@/components/brand/FolioMark";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/hooks/use-preferences";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const prefs = usePreferences();

  useEffect(() => {
    if (!loading && user) navigate({ to: prefs.landing === "chat" ? "/chat" : "/dashboard" });
  }, [user, loading, navigate, prefs.landing]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Welcome to Folio");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      // Must be a public, same-origin URL — never a protected route.
      redirect_uri: window.location.origin,
    });
    if (result.error) { toast.error("Google sign-in failed"); setBusy(false); return; }
    if (result.redirected) return;
  }

  return (
    <div className="relative min-h-screen grid md:grid-cols-2 bg-background paper-grain overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      </div>

      <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-[420px] w-[420px] rounded-full rgb-blob opacity-40 blur-3xl" />
        <Link to="/" className="relative font-serif text-2xl">Folio</Link>
        <div className="relative">
          <div className="mb-8"><FolioMark className="h-28 w-28" /></div>
          <h2 className="font-serif text-5xl leading-tight">
            A quiet place<br/><em className="italic">to think.</em>
          </h2>
          <p className="mt-4 text-sm opacity-70 max-w-sm">
            Sign in and your day picks up exactly where you left it — memories, threads and all.
          </p>
        </div>
        <div className="relative text-xs opacity-60">© Folio</div>
      </div>

      <div className="relative flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl mb-1">
            {mode === "signin" ? "Welcome back" : "Create your room"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "signin" ? "Sign in to your workspace." : "It takes about ten seconds."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-md border border-border py-2.5 text-sm hover:bg-secondary transition disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email" required placeholder="you@somewhere.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password" required minLength={6} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit" disabled={busy}
              className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            {mode === "signin" ? "No account yet?" : "Already have one?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="ink-underline text-foreground">
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
