import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, LogOut, Mail, KeyRound, Zap, Sparkles, MousePointer2, BookOpenText, Link2Off, ArrowRight, Calendar, Music2, ListTodo, GitBranch, MessageSquare, Cloud, HardDrive, Video, Clock, Code2, Palette } from "lucide-react";
import { AppShell, PageHeading } from "@/components/shell/AppShell";
import { FolioMark } from "@/components/brand/FolioMark";
import { TiltCard } from "@/components/chat/TiltCard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { listConnections, disconnectProvider, saveApiToken } from "@/lib/connections.functions";
import { TOKEN_PROVIDERS } from "@/lib/token-providers";

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
  {
    id: "github", name: "GitHub", tagline: "Repos, issues and pull requests",
    icon: Code2, hue: "from-zinc-500/25 to-slate-500/10", kind: "token",
    tokenHelp: "Create a fine-grained personal access token with read access to your repositories.",
    tokenUrl: "https://github.com/settings/tokens",
  },
  {
    id: "linear", name: "Linear", tagline: "Triage issues and plan cycles",
    icon: GitBranch, hue: "from-violet-500/25 to-indigo-500/10", kind: "token",
    tokenHelp: "Linear → Settings → Security & access → Personal API keys.",
    tokenUrl: "https://linear.app/settings/api",
  },
  {
    id: "slack", name: "Slack", tagline: "Read channels, post messages",
    icon: MessageSquare, hue: "from-fuchsia-500/25 to-pink-500/10", kind: "token",
    tokenHelp: "Paste a user OAuth token (xoxp-…) from your Slack app's OAuth page.",
    tokenUrl: "https://api.slack.com/apps",
  },
  {
    id: "todoist", name: "Todoist", tagline: "Capture, list and complete tasks",
    icon: ListTodo, hue: "from-red-500/25 to-rose-500/10", kind: "token",
    tokenHelp: "Todoist → Settings → Integrations → Developer → API token.",
    tokenUrl: "https://app.todoist.com/app/settings/integrations/developer",
  },
  {
    id: "figma", name: "Figma", tagline: "Pull frames and list your files",
    icon: Palette, hue: "from-orange-500/25 to-red-500/10", kind: "token",
    tokenHelp: "Figma → Settings → Personal access tokens.",
    tokenUrl: "https://www.figma.com/developers/api#access-tokens",
  },
  {
    id: "openai", name: "OpenAI", tagline: "Use your own key for extra models",
    icon: Sparkles, hue: "from-emerald-500/25 to-teal-500/10", kind: "token",
    tokenHelp: "Create a secret key at platform.openai.com/api-keys.",
    tokenUrl: "https://platform.openai.com/api-keys",
  },
];

const COMING_SOON: ProviderCard[] = [
  { id: "gcal",     name: "Google Calendar", tagline: "See your day, book focus blocks, RSVP",  icon: Calendar,      hue: "from-sky-500/25 to-blue-500/10",       kind: "soon" },
  { id: "spotify",  name: "Spotify",         tagline: "Play focus playlists, set the mood",     icon: Music2,        hue: "from-emerald-500/25 to-green-500/10",  kind: "soon" },
  { id: "gdrive",   name: "Google Drive",    tagline: "Find and summarise your docs",           icon: HardDrive,     hue: "from-yellow-500/25 to-amber-500/10",   kind: "soon" },
  { id: "dropbox",  name: "Dropbox",         tagline: "Search files and folders",               icon: Cloud,         hue: "from-blue-500/25 to-cyan-500/10",      kind: "soon" },
  { id: "zoom",     name: "Zoom",            tagline: "Meetings, recordings, transcripts",      icon: Video,         hue: "from-sky-500/25 to-indigo-500/10",     kind: "soon" },
  { id: "toggl",    name: "Toggl",           tagline: "Start/stop timers from chat",            icon: Clock,         hue: "from-pink-500/25 to-rose-500/10",      kind: "soon" },
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
    const provider = TOKEN_PROVIDERS.find((p) => p === tokenOpen.id);
    if (!provider) return;
    setBusy(tokenOpen.id);
    try {
      const res = await saveToken({ data: { provider, token: tokenValue.trim() } });

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
    <AppShell>

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

        <div className="mt-14">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Coming soon</p>
              <h2 className="font-serif text-2xl mt-1">More of your stack.</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm hidden sm:block">
              These are ready to wire up. Tap <em>Notify me</em> and Folio will surface it first as soon as OAuth lands.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {COMING_SOON.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.id} className={`relative rounded-2xl border border-border/50 bg-gradient-to-br ${p.hue} bg-card/40 backdrop-blur-xl p-4 overflow-hidden`}>
                  <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl border border-border/60 bg-background/60 grid place-items-center">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-serif text-base">{p.name}</div>
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/70">
                          Soon
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.tagline}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px]"
                      onClick={() => toast.success(`We'll notify you when ${p.name} is ready.`)}
                    >
                      <Sparkles className="h-3 w-3" /> Notify me
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-10 max-w-xl">
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
    </AppShell>
  );
}
