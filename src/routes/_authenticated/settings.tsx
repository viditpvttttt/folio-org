import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, MessageCircle, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { TiltCard } from "@/components/chat/TiltCard";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { DEFAULT_PHYSICS, type OrbPhysics } from "@/components/chat/OrbControls";

const STORAGE_KEY = "folio.orb-physics";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · Folio" },
      { name: "description", content: "Tune Folio's voice, orb physics, and privacy preferences." },
    ],
  }),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [physics, setPhysics] = useState<OrbPhysics>(DEFAULT_PHYSICS);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPhysics({ ...DEFAULT_PHYSICS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(physics)); } catch { /* ignore */ }
  }, [physics]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] -z-10" />

      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" {...physics} />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70 inline-flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70 inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Chat</Link>
          <Link to="/settings" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium inline-flex items-center gap-1.5"><SettingsIcon className="h-3.5 w-3.5" />Settings</Link>
        </nav>
        <button onClick={signOut} title="Sign out" className="ml-auto text-foreground/60 hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10 space-y-6">
        <h1 className="font-serif text-5xl">Settings</h1>
        <p className="text-muted-foreground">Signed in as {user?.email}</p>

        <TiltCard max={3}>
          <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6">
            <div className="flex items-center gap-5 mb-6">
              <OrbStatus active amplitude={0.45} listening className="h-24 w-24" {...physics} />
              <div>
                <h2 className="font-serif text-2xl">Orb physics</h2>
                <p className="text-sm text-muted-foreground">Adjust how the voice orb moves and reacts.</p>
              </div>
            </div>

            {(
              [
                { key: "fluidity", label: "Fluidity", hint: "How much it sways with sound" },
                { key: "damping", label: "Responsiveness", hint: "Higher = snappier reactions" },
                { key: "distort", label: "Distortion", hint: "Surface turbulence" },
              ] as const
            ).map(({ key, label, hint }) => (
              <div key={key} className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">{physics[key].toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[physics[key]]}
                  onValueChange={([v]) => setPhysics({ ...physics, [key]: v })}
                />
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
              </div>
            ))}

            <button
              onClick={() => setPhysics(DEFAULT_PHYSICS)}
              className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-foreground/5"
            >
              Reset to default
            </button>
          </section>
        </TiltCard>

        <TiltCard max={3}>
          <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 space-y-4">
            <h2 className="font-serif text-2xl">Voice & motion</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Voice replies</div>
                <p className="text-xs text-muted-foreground">Hear Folio speak responses aloud.</p>
              </div>
              <Switch checked={voiceReplies} onCheckedChange={setVoiceReplies} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Reduce motion</div>
                <p className="text-xs text-muted-foreground">Dial back ambient parallax and orb breathing.</p>
              </div>
              <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
            </div>
          </section>
        </TiltCard>
      </main>
    </div>
  );
}
