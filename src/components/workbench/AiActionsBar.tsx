import type { ComponentType } from "react";
import { Sparkles, Wand2, Bug, FileText, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateMenu, type WbTemplate } from "./TemplateMenu";

export type AiActionId = "explain" | "refactor" | "fix" | "document";

/** AI actions offered on the current editor selection. */
export const EDITOR_ACTIONS: {
  id: AiActionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  prompt: string;
}[] = [
  {
    id: "explain",
    label: "Explain",
    icon: Sparkles,
    prompt: "Explain what this selection does and why, concisely",
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: Wand2,
    prompt:
      "Refactor this selection for clarity and correctness — read the file first, then write the improved version with writeFile",
  },
  {
    id: "fix",
    label: "Fix bugs",
    icon: Bug,
    prompt:
      "Find and fix any bugs in this selection — read the file first, then apply the fix with writeFile",
  },
  {
    id: "document",
    label: "Document",
    icon: FileText,
    prompt:
      "Add clear comments/JSDoc to this selection — read the file first, then write it back with writeFile",
  },
];

/**
 * Floating toolbar shown when code is selected in the editor. Actions are
 * toggleable so several can be batched into one combined AI request, and
 * batches can be saved as one-click templates (TemplateMenu).
 */
export function AiActionsBar({
  lineCount,
  selected,
  templates,
  saving,
  onToggle,
  onRun,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplate,
}: {
  lineCount: number;
  selected: AiActionId[];
  templates: WbTemplate[];
  saving: boolean;
  onToggle: (id: AiActionId) => void;
  onRun: () => void;
  onSaveTemplate: (name: string) => void;
  onDeleteTemplate: (id: string) => void;
  onApplyTemplate: (actions: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 bg-foreground/[0.03] px-4 py-1.5 text-[11px] animate-in slide-in-from-top-1 fade-in duration-300">
      <span className="text-muted-foreground">
        <span key={lineCount} className="animate-in zoom-in-50 duration-200 inline-block">
          {lineCount}
        </span>{" "}
        lines selected
      </span>
      <TemplateMenu
        templates={templates}
        selectedCount={selected.length}
        saving={saving}
        onApply={onApplyTemplate}
        onSave={onSaveTemplate}
        onDelete={onDeleteTemplate}
      />
      <div className="ml-auto flex items-center gap-1.5">
        {EDITOR_ACTIONS.map(({ id, label, icon: Icon }, i) => {
          const on = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              aria-pressed={on}
              style={{ animationDelay: `${i * 50}ms` }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1",
                on
                  ? "scale-105 border-transparent bg-foreground text-background shadow-sm"
                  : "border-border/60 bg-background/60 hover:bg-foreground/10 active:scale-95",
              )}
              title={`${on ? "Remove from" : "Add to"} batch: ${label}`}
            >
              <Icon className={cn("h-3 w-3 transition-transform", on && "scale-110")} /> {label}
            </button>
          );
        })}
        <button
          onClick={onRun}
          disabled={selected.length === 0}
          className={cn(
            "ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition-all duration-200 active:scale-95",
            selected.length > 0
              ? "animate-in zoom-in-50 bg-foreground text-background hover:opacity-90"
              : "bg-foreground/50 text-background/70",
          )}
          title="Run all selected AI actions as one batch"
        >
          <Play className="h-3 w-3" />
          Run{selected.length > 0 ? ` (${selected.length})` : ""}
        </button>
      </div>
    </div>
  );
}
