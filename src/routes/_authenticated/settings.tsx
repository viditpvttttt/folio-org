import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sun, Moon, Monitor, Plus, Trash2, Layers, Sparkle, Volume2, Shield,
  UserRound, Palette, LogOut, RotateCcw, Download,
} from "lucide-react";
import { AppShell, GlassCard } from "@/components/shell/AppShell";
import { FolioMark } from "@/components/brand/FolioMark";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";
import { useAccessibility, type FontScale, type Theme } from "@/hooks/use-accessibility";
import { usePreferences, type Tone, type Length } from "@/hooks/use-preferences";
import { listMemories, addMemory, deleteMemory } from "@/lib/memories.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · Folio" },
      { name: "description", content: "Tune how Folio sounds, looks, speaks, remembers, and what it is allowed to know." },
      { property: "og:title", content: "Settings · Folio" },
      { property: "og:description", content: "Tune how Folio sounds, looks, speaks, remembers, and what it is allowed to know." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FONT_SCALES: { value: FontScale; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra" },
];

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Paper", icon: Sun },
  { value: "dark", label: "Ink", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "warm", label: "Warm", hint: "Friendly, human, a little soft." },
  { value: "neutral", label: "Neutral", hint: "Even and factual." },
  { value: "direct", label: "Direct", hint: "Short sentences, no preamble." },
  { value: "playful", label: "Playful", hint: "Light, witty, a bit of spark." },
];

const LENGTHS: { value: Length; label: string; hint: string }[] = [
  { value: "brief", label: "Brief", hint: "A few lines." },
  { value: "balanced", label: "Balanced", hint: "Enough to be useful." },
  { value: "thorough", label: "Thorough", hint: "Full reasoning and detail." },
];

function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <AppShell>
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-10">
        {/* ---------- Masthead ---------- */}
        <header className="relative mb-14">
          <div aria-hidden className="pointer-events-none absolute -left-12 -top-20 h-64 w-[28rem] rounded-full rgb-blob opacity-25 blur-[80px]" />
          <div className="relative flex items-end gap-6">
            <FolioMark className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Preferences</p>
              <h1 className="mt-3 font-serif text-[clamp(2.5rem,7vw,4.25rem)] leading-[0.94] tracking-tight">
                Make it <em className="italic">yours.</em>
              </h1>
              <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
                How Folio sounds, how it looks, what it may remember, and what it is allowed to know.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <Section icon={UserRound} eyebrow="Account" title="You">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Signed in as</div>
                <div className="truncate font-serif text-xl">{user?.email}</div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          </Section>

          <BehaviourSection />
          <VoiceSection />
          <AppearanceSection />
          <PrivacySection />
          <StacksSection />
        </div>
      </main>
    </AppShell>
  );
}

/* ------------------------------ primitives ------------------------------ */

function Section({
  icon: Icon, eyebrow, title, description, children, actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <GlassCard>
      <section className="p-7">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl border border-border/60 bg-background/40 p-2.5">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
            <h2 className="mt-1.5 font-serif text-2xl leading-tight">{title}</h2>
            {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
        <div className="space-y-6">{children}</div>
      </section>
    </GlassCard>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-3">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function OptionGrid<T extends string>({
  options, value, onChange, cols = 4,
}: {
  options: { value: T; label: string; hint?: string; icon?: React.ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5",
              active ? "border-foreground/70 bg-foreground/[0.06]" : "border-border/60 hover:border-border",
            )}
          >
            <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full rgb-blob opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-25" />
            <span className="relative flex items-center gap-1.5 text-sm">
              {o.icon && <o.icon className="h-3.5 w-3.5" />} {o.label}
            </span>
            {o.hint && <span className="relative mt-1 block text-[11px] leading-snug text-muted-foreground">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-border/40 pt-4 first:border-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

/* ------------------------------- sections ------------------------------- */

function BehaviourSection() {
  const prefs = usePreferences();
  return (
    <Section
      icon={Sparkle}
      eyebrow="Assistant"
      title="How Folio answers"
      description="Voice, length, and what it calls you. Applied to every new reply."
    >
      <Field label="Tone">
        <OptionGrid options={TONES} value={prefs.tone} onChange={(tone) => prefs.update({ tone })} />
      </Field>
      <Field label="Reply length">
        <OptionGrid options={LENGTHS} value={prefs.length} onChange={(length) => prefs.update({ length })} cols={3} />
      </Field>
      <Field label="Call me" hint="Optional">
        <Input
          value={prefs.nickname}
          onChange={(e) => prefs.update({ nickname: e.target.value })}
          placeholder="e.g. Sam"
          className="max-w-xs bg-background/50"
        />
      </Field>
      <div className="space-y-4">
        <ToggleRow
          label="Suggested prompts"
          hint="Show the starter list on an empty conversation."
          checked={prefs.showSuggestions}
          onChange={(showSuggestions) => prefs.update({ showSuggestions })}
        />
        <ToggleRow
          label="Enter sends"
          hint="Off means Enter adds a newline and ⌘/Ctrl + Enter sends."
          checked={prefs.enterToSend}
          onChange={(enterToSend) => prefs.update({ enterToSend })}
        />
      </div>
    </Section>
  );
}

function VoiceSection() {
  const prefs = usePreferences();
  return (
    <Section icon={Volume2} eyebrow="Sound" title="Voice" description="Speaking and listening defaults.">
      <ToggleRow
        label="Speak replies aloud"
        hint="Turn voice replies on the moment a conversation opens."
        checked={prefs.autoSpeak}
        onChange={(autoSpeak) => prefs.update({ autoSpeak })}
      />
      <Field label="Speaking pace" hint={`${prefs.speechRate.toFixed(2)}×`}>
        <Slider
          value={[prefs.speechRate]}
          min={0.6}
          max={1.6}
          step={0.05}
          onValueChange={([v]) => prefs.update({ speechRate: v })}
          className="max-w-sm"
          aria-label="Speaking pace"
        />
      </Field>
    </Section>
  );
}

function AppearanceSection() {
  const a11y = useAccessibility();
  return (
    <Section
      icon={Palette}
      eyebrow="Appearance"
      title="Paper &amp; ink"
      description="Theme, type size, contrast, and motion."
      actions={
        <button onClick={a11y.reset} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs transition hover:bg-foreground/5">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      }
    >
      <Field label="Theme">
        <OptionGrid options={THEMES} value={a11y.theme} onChange={(theme) => a11y.update({ theme })} cols={3} />
      </Field>
      <Field label="Text size">
        <OptionGrid options={FONT_SCALES} value={a11y.fontScale} onChange={(fontScale) => a11y.update({ fontScale })} />
      </Field>
      <div className="space-y-4">
        <ToggleRow label="High contrast" hint="Deeper borders and stronger text for readability." checked={a11y.contrast === "high"} onChange={(v) => a11y.update({ contrast: v ? "high" : "normal" })} />
        <ToggleRow label="Reduce motion" hint="Calms ambient animation and the mark's breathing." checked={a11y.motion === "reduced"} onChange={(v) => a11y.update({ motion: v ? "reduced" : "normal" })} />
        <ToggleRow label="Dyslexia-friendly text" hint="Looser spacing and a rounder body typeface." checked={a11y.dyslexic} onChange={(dyslexic) => a11y.update({ dyslexic })} />
        <ToggleRow label="Larger tap targets" hint="Enforces a 44px minimum on touch devices." checked={a11y.largeTapTargets} onChange={(largeTapTargets) => a11y.update({ largeTapTargets })} />
      </div>
    </Section>
  );
}

function PrivacySection() {
  const prefs = usePreferences();
  const qc = useQueryClient();
  const listFn = useServerFn(listMemories);
  const delFn = useServerFn(deleteMemory);
  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: () => listFn() });
  const facts = memories.filter((m) => m.kind !== "stack");

  const forgetAll = useMutation({
    mutationFn: async () => {
      for (const f of facts) await delFn({ data: { id: f.id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Folio forgot everything it had noted about you.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const exportMemories = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "folio-memories.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section
      icon={Shield}
      eyebrow="Privacy"
      title="What Folio may know"
      description="Granular control over memory and context. Nothing here leaves your account."
    >
      <div className="space-y-4">
        <ToggleRow
          label="Remember facts about me"
          hint="Lets Folio note preferences and details across conversations."
          checked={prefs.allowMemory}
          onChange={(allowMemory) => prefs.update({ allowMemory })}
        />
        <ToggleRow
          label="Use my location"
          hint="Improves weather, commute, and time-of-day answers."
          checked={prefs.shareLocation}
          onChange={(shareLocation) => prefs.update({ shareLocation })}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-background/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{facts.length} remembered {facts.length === 1 ? "note" : "notes"}</div>
            <p className="text-xs text-muted-foreground">Export a copy, or clear the lot.</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportMemories} disabled={memories.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={facts.length === 0 || forgetAll.isPending}
            onClick={() => forgetAll.mutate()}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Forget all
          </Button>
        </div>

        {facts.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {facts.slice(0, 6).map((f) => (
              <li key={f.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                <span className="flex-1">{f.content}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={prefs.reset} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs transition hover:bg-foreground/5">
        <RotateCcw className="h-3 w-3" /> Reset assistant preferences
      </button>
    </Section>
  );
}

function StacksSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMemories);
  const addFn = useServerFn(addMemory);
  const delFn = useServerFn(deleteMemory);
  const [draft, setDraft] = useState("");

  const { data: memories = [] } = useQuery({ queryKey: ["memories"], queryFn: () => listFn() });
  const stacks = memories.filter((m) => m.kind === "stack");

  const add = useMutation({
    mutationFn: (content: string) => addFn({ data: { content, kind: "stack" } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Stack saved. Folio will match this style.");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  return (
    <Section
      icon={Layers}
      eyebrow="Context"
      title="Project stacks"
      description="Languages, frameworks, conventions. Folio writes code the way your project already does."
    >
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Next.js 15 App Router, TypeScript, Tailwind + shadcn, Drizzle ORM, Postgres. Named exports, kebab-case files."
          rows={3}
          className="bg-background/50"
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={!draft.trim() || add.isPending} onClick={() => add.mutate(draft.trim())}>
            <Plus className="mr-1 h-4 w-4" /> Add stack
          </Button>
        </div>
      </div>

      {stacks.length > 0 ? (
        <ul className="divide-y divide-border/40 border-y border-border/40">
          {stacks.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-3.5">
              <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{s.content}</div>
              <button onClick={() => remove.mutate(s.id)} aria-label="Delete stack" className="text-muted-foreground transition hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          No stacks yet. Add one above, or just describe your project in chat and Folio will note it.
        </p>
      )}
    </Section>
  );
}
