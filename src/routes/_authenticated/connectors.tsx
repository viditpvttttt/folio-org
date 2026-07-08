import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, LogOut, Mail, KeyRound, Zap, Sparkles, MousePointer2, BookOpenText, Link2Off, ArrowRight, Calendar, Music2, ListTodo, GitBranch, Github, MessageSquare, Trello, Figma, Cloud, HardDrive, Video, Clock } from "lucide-react";
import { AmbientScene } from "@/components/chat/AmbientScene";
import { CursorGlow } from "@/components/chat/CursorGlow";
import { OrbStatus } from "@/components/chat/OrbStatus";
import { TiltCard } from "@/components/chat/TiltCard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { listConnections, disconnectProvider, saveApiToken } from "@/lib/connections.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/connectors")({
  component: ConnectorsPage,
  head: () => ({
    meta: [
      { title: "Connectors · Folio" },
      { name: "description", content: "Connect Gmail, Calendar, Spotify, Slack, GitHub and more so Folio can act on your behalf." },
    ],
  }),
});

type ProviderCard = {
  id: string;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  hue: string;
  kind: "oauth" | "token" | "soon";
  tokenHelp?: string;
  tokenUrl?: string;
};


const PROVIDERS: ProviderCard[] = [
  {
    id: "google", name: "Gmail", tagline: "Read, search and send mail from chat",
    icon: Mail, hue: "from-rose-500/25 to-orange-500/10", kind: "oauth",
  },
  {
    id: "notion", name: "Notion", tagline: "Search your pages and databases",
    icon: BookOpenText, hue: "from-slate-400/25 to-zinc-500/10", kind: "oauth",
  },
  {
    id: "vercel", name: "Vercel", tagline: "List projects and deployments",
    icon: Zap, hue: "from-white/20 to-slate-500/10", kind: "token",
    tokenHelp: "Create a token at vercel.com/account/tokens with scope 'Full Account'.",
    tokenUrl: "https://vercel.com/account/tokens",
  },
  {
    id: "cursor", name: "Cursor", tagline: "Keep your Cursor account handy",
    icon: MousePointer2, hue: "from-indigo-500/25 to-violet-500/10", kind: "token",
    tokenHelp: "Paste your API key from cursor.com/settings.",
    tokenUrl: "https://cursor.com/settings",
  },
];

function ConnectorsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listConnections);
  const disconnect = useServerFn(disconnectProvider);
  const saveToken = useServerFn(saveApiToken);

  const q = useQuery({ queryKey: ["connections", user?.id], queryFn: () => list(), enabled: !!user });

  const [tokenOpen, setTokenOpen] = useState<null | ProviderCard>(null);
  const [tokenValue, setTokenValue] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Listen for the popup to postMessage after OAuth completes
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "folio-oauth") return;
      qc.invalidateQueries({ queryKey: ["connections"] });
      if (e.data.ok) toast.success(`${e.data.provider} connected`);
      else toast.error(`Couldn't connect ${e.data.provider}`);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [qc]);

  const startOAuth = async (providerId: string) => {
    setBusy(providerId);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in again");
      const url = `/api/public/oauth/${providerId}/start?token=${encodeURIComponent(token)}`;
      const w = window.open(url, "folio-oauth", "width=520,height=680");
      if (!w) toast.error("Popup blocked — allow popups and try again.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const submitToken = async () => {
    if (!tokenOpen) return;
    if (tokenOpen.id !== "vercel" && tokenOpen.id !== "cursor") return;
    setBusy(tokenOpen.id);
    try {
      const res = await saveToken({ data: { provider: tokenOpen.id, token: tokenValue.trim() } });
      toast.success(`${tokenOpen.name} connected as ${res.label ?? "account"}`);
      qc.invalidateQueries({ queryKey: ["connections"] });
      setTokenOpen(null);
      setTokenValue("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (providerId: string, name: string) => {
    setBusy(providerId);
    try {
      await disconnect({ data: { provider: providerId } });
      toast.success(`${name} disconnected`);
      qc.invalidateQueries({ queryKey: ["connections"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const connections = q.data ?? [];
  const findConn = (id: string) => connections.find((c) => c.provider === id);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <AmbientScene />
      <CursorGlow />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,#ff4d8d_0%,transparent_65%)] opacity-40 blur-3xl" />
        <div className="absolute top-40 -right-32 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,#4d9bff_0%,transparent_65%)] opacity-40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,#b66dff_0%,transparent_65%)] opacity-35 blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] -z-10" />

      <header className="relative z-10 px-6 py-4 flex items-center gap-4 border-b border-border/40 backdrop-blur-xl bg-background/30">
        <OrbStatus active className="h-9 w-9" />
        <span className="font-serif text-2xl">Folio</span>
        <nav className="ml-6 hidden md:flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Dashboard</Link>
          <Link to="/chat" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Chat</Link>
          <Link to="/connectors" className="px-3 py-1.5 rounded-full bg-foreground/10 font-medium">Connectors</Link>
          <Link to="/settings" className="px-3 py-1.5 rounded-full hover:bg-foreground/5 text-foreground/70">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => navigate({ to: "/chat" })} className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-foreground/5">Open chat</button>
          <button onClick={signOut} title="Sign out" className="text-foreground/60 hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Bring your accounts</p>
          <h1 className="font-serif text-5xl md:text-6xl mt-3">Connectors.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Give Folio permission to act on your behalf. Every connection is per-user, tokens are stored encrypted, and you can revoke access at any time.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {PROVIDERS.map((p) => {
            const conn = findConn(p.id);
            const connected = !!conn;
            const Icon = p.icon;
            return (
              <TiltCard key={p.id} max={5}>
                <div className={`relative rounded-2xl border border-border/60 bg-gradient-to-br ${p.hue} bg-card/60 backdrop-blur-xl p-5 h-full overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 grid place-items-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-serif text-xl">{p.name}</div>
                        {connected && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-500">
                            <Check className="h-3 w-3" /> Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.tagline}</p>
                      {connected && (
                        <p className="text-[11px] mt-2 text-foreground/70 truncate">
                          {conn?.account_label ?? "Connected account"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    {connected ? (
                      <>
                        <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => remove(p.id, p.name)}>
                          <Link2Off className="h-3.5 w-3.5" /> Disconnect
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/chat" })}>
                          Use it <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : p.kind === "oauth" ? (
                      <Button size="sm" disabled={busy === p.id} onClick={() => startOAuth(p.id)}>
                        <Sparkles className="h-3.5 w-3.5" /> Connect {p.name}
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busy === p.id} onClick={() => setTokenOpen(p)}>
                        <KeyRound className="h-3.5 w-3.5" /> Add token
                      </Button>
                    )}
                    {!connected && p.tokenUrl && (
                      <a href={p.tokenUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
                        Get token <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-8 max-w-xl">
          Tokens are stored per-user with row-level security in your backend. Folio only uses them inside your own chat, on the server, never in the browser.
        </p>
      </main>

      <Dialog open={!!tokenOpen} onOpenChange={(o) => { if (!o) { setTokenOpen(null); setTokenValue(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {tokenOpen?.name}</DialogTitle>
            <DialogDescription>{tokenOpen?.tokenHelp}</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            autoFocus
            placeholder="Paste your API token"
            value={tokenValue}
            onChange={(e) => setTokenValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitToken(); }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setTokenOpen(null)}>Cancel</Button>
            <Button onClick={submitToken} disabled={busy === tokenOpen?.id || tokenValue.trim().length < 8}>
              Save token
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
