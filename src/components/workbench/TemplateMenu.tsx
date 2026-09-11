import { useState } from "react";
import { Layers, Play, Trash2, Plus, Loader2, Sparkles, Wand2, Bug, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WbTemplate {
  id: string;
  name: string;
  actions: string[];
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: typeof Sparkles }> = {
  explain: { label: "Explain", icon: Sparkles },
  refactor: { label: "Refactor", icon: Wand2 },
  fix: { label: "Fix bugs", icon: Bug },
  document: { label: "Document", icon: FileText },
};

/**
 * Saved batches of AI actions ("templates"). One click on a template applies
 * its whole action set to the current editor selection. Templates are created
 * from the actions currently picked in the AI bar.
 */
export function TemplateMenu({
  templates,
  selectedCount,
  saving,
  onApply,
  onSave,
  onDelete,
}: {
  templates: WbTemplate[];
  selectedCount: number;
  saving: boolean;
  onApply: (actions: string[]) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const save = () => {
    if (!name.trim() || saving) return;
    onSave(name.trim());
    setName("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 transition hover:bg-foreground/10 active:scale-95"
        title="Saved action sets — apply in one click"
      >
        <Layers className="h-3 w-3" /> Templates
        {templates.length > 0 && (
          <span
            key={templates.length}
            className="animate-in zoom-in-50 fade-in duration-200 rounded-full bg-foreground px-1.5 text-[9px] font-semibold leading-4 text-background"
          >
            {templates.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-in fade-in slide-in-from-top-1 zoom-in-95 absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-border/60 bg-background/95 p-2 shadow-xl backdrop-blur-xl duration-150">
            <p className="px-1 pb-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              One-click action sets
            </p>

            {templates.length === 0 && selectedCount === 0 && (
              <p className="px-1 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Pick a few AI actions, then save the batch here to replay it on any selection with one click.
              </p>
            )}

            <ul className="space-y-0.5">
              {templates.map((t, i) => (
                <li
                  key={t.id}
                  className="animate-in fade-in slide-in-from-left-1 duration-300"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="group/tpl flex items-center gap-1 rounded-lg pr-1 transition hover:bg-foreground/5">
                    <button
                      onClick={() => onApply(t.actions)}
                      className="flex-1 text-left px-1.5 py-1.5"
                      title="Run this template on the selection"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <Play className="h-3 w-3 shrink-0 opacity-50 transition-all group-hover/tpl:text-foreground group-hover/tpl:opacity-100" />
                        <span className="truncate">{t.name}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-1 pl-[18px]">
                        {t.actions.map((a) => {
                          const meta = ACTION_META[a];
                          if (!meta) return null;
                          const Icon = meta.icon;
                          return (
                            <span
                              key={a}
                              className="inline-flex items-center gap-0.5 rounded-full bg-foreground/[0.06] px-1.5 py-px text-[9px] text-muted-foreground"
                            >
                              <Icon className="h-2 w-2" />
                              {meta.label}
                            </span>
                          );
                        })}
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="rounded-md p-1 text-muted-foreground/40 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover/tpl:opacity-100"
                      title="Delete template"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {selectedCount > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-1 mt-1.5 border-t border-border/50 pt-1.5 duration-300">
                <div className="flex items-center gap-1 px-1">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save()}
                    placeholder={`Save ${selectedCount} action${selectedCount === 1 ? "" : "s"} as…`}
                    maxLength={60}
                    className="min-w-0 flex-1 rounded-md border border-border/60 bg-card px-2 py-1 text-[11px] outline-none transition focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                  />
                  <button
                    onClick={save}
                    disabled={!name.trim() || saving}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background transition",
                      "hover:opacity-90 active:scale-95 disabled:opacity-40",
                    )}
                    title="Save template"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3 w-3" /> Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
