import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, MessageCircle, LayoutDashboard, Settings as SettingsIcon, Sun, Moon, Monitor, Plus, Trash2, Layers } from "lucide-react";
import { AppShell, PageHeading } from "@/components/shell/AppShell";
import { FolioMark } from "@/components/brand/FolioMark";
import { TiltCard } from "@/components/chat/TiltCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useAccessibility, type FontScale, type Theme } from "@/hooks/use-accessibility";
import { listMemories, addMemory, deleteMemory } from "@/lib/memories.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings · Folio" },
      { name: "description", content: "Tune Folio's appearance, accessibility, the mark, and remembered project stacks." },
    ],
  }),
});

const FONT_SCALES: { value: FontScale; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
];

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsPage() {
  const { user, signOut } = useAuth();
  const a11y = useAccessibility();

  return (
    <AppShell>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div>
          <h1 className="font-serif text-5xl">Settings</h1>
          <p className="text-muted-foreground mt-1">Signed in as {user?.email}</p>
        </div>

        {/* ===== Appearance ===== */}
        <TiltCard max={2}>
          <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 space-y-6">
            <div>
              <h2 className="font-serif text-2xl">Appearance</h2>
              <p className="text-sm text-muted-foreground">Theme, size, and contrast.</p>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Theme</div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => a11y.update({ theme: value })}
                    aria-pressed={a11y.theme === value}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition ${a11y.theme === value ? "border-foreground bg-foreground/5" : "border-border/60 hover:bg-foreground/5"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Text size</div>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SCALES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => a11y.update({ fontScale: value })}
                    aria-pressed={a11y.fontScale === value}
                    className={`rounded-xl border p-3 text-xs transition ${a11y.fontScale === value ? "border-foreground bg-foreground/5" : "border-border/60 hover:bg-foreground/5"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow label="High contrast" hint="Bumps up borders and text contrast for readability." checked={a11y.contrast === "high"} onChange={(v) => a11y.update({ contrast: v ? "high" : "normal" })} />
            <ToggleRow label="Reduce motion" hint="Disables ambient animations and orb breathing." checked={a11y.motion === "reduced"} onChange={(v) => a11y.update({ motion: v ? "reduced" : "normal" })} />
            <ToggleRow label="Dyslexia-friendly font" hint="Loosens spacing and switches to a rounder typeface for body text." checked={a11y.dyslexic} onChange={(v) => a11y.update({ dyslexic: v })} />
            <ToggleRow label="Larger tap targets" hint="Enforces a 44px minimum for buttons and links on touch." checked={a11y.largeTapTargets} onChange={(v) => a11y.update({ largeTapTargets: v })} />

            <button onClick={a11y.reset} className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-foreground/5">
              Reset appearance
            </button>
          </section>
        </TiltCard>

        {/* ===== Project stacks ===== */}
        <TiltCard max={2}>
          <StacksSection />
        </TiltCard>

        {/* ===== Identity ===== */}
        <TiltCard max={3}>
          <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 flex items-center gap-6">
            <FolioMark className="h-24 w-24 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-serif text-2xl">The mark</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Folio's two pages lift while you speak, sweep while it thinks, and breathe while it answers.
                Motion follows your accessibility settings above.
              </p>
            </div>
          </section>
        </TiltCard>

      </main>
    </AppShell>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function StacksSection() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMemories);
  const addFn = useServerFn(addMemory);
  const delFn = useServerFn(deleteMemory);
  const [draft, setDraft] = useState("");

  const { data: memories = [] } = useQuery({
    queryKey: ["memories"],
    queryFn: () => listFn(),
  });
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
    <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-foreground/5 p-2.5"><Layers className="h-5 w-5" /></div>
        <div>
          <h2 className="font-serif text-2xl">Project stacks</h2>
          <p className="text-sm text-muted-foreground">Tell Folio about your project(s) — languages, frameworks, conventions. It'll match your style when writing code.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Next.js 15 App Router, TypeScript, Tailwind + shadcn, Drizzle ORM, Postgres. Prefer named exports, kebab-case files, no default exports."
          rows={3}
          className="bg-background/50"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!draft.trim() || add.isPending}
            onClick={() => add.mutate(draft.trim())}
          >
            <Plus className="h-4 w-4 mr-1" /> Add stack
          </Button>
        </div>
      </div>

      {stacks.length > 0 && (
        <ul className="space-y-2">
          {stacks.map((s) => (
            <li key={s.id} className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="flex-1 text-sm whitespace-pre-wrap">{s.content}</div>
              <button
                onClick={() => remove.mutate(s.id)}
                aria-label="Delete stack"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {stacks.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No stacks saved yet. Add one above, or just tell Folio about your project in chat and it'll save it automatically.</p>
      )}
    </section>
  );
}
