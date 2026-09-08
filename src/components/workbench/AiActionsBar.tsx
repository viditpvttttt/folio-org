import type { ComponentType } from "react";
import { Sparkles, Wand2, Bug, FileText, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Floating toolbar shown when code is selected in the editor.
 * Actions are toggleable so several can be batched into one combined
 * AI request ("Run (n)") — bulk edits instead of one-by-one round trips.
 */
export function AiActionsBar({
  lineCount,
  selected,
  onToggle,
  onRun,
}: {
  lineCount: number;
  selected: AiActionId[];
  onToggle: (id: AiActionId) => void;
  onRun: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 bg-foreground/[0.03] px-4 py-1.5 text-[11px] animate-in slide-in-from-top-1 fade-in duration-300">
      <span className="text-muted-foreground">{lineCount} lines selected</span>
      <span className="hidden text-muted-foreground/50 sm:inline">· pick actions, run as one</span>
      <div className="ml-auto flex items-center gap-1.5">
        {EDITOR_ACTIONS.map(({ id, label, icon: Icon }) => {
          const on = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              aria-pressed={on}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition",
                on
                  ? "border-transparent bg-foreground text-background"
                  : "border-border/60 bg-background/60 hover:bg-foreground/10",
              )}
              title={`${on ? "Remove from" : "Add to"} batch: ${label}`}
            >
              <Icon className="h-3 w-3" /> {label}
            </button>
          );
        })}
        <button
          onClick={onRun}
          disabled={selected.length === 0}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 font-medium text-background transition hover:opacity-90 disabled:opacity-40"
          title="Run all selected AI actions as one batch"
        >
          <Play className="h-3 w-3" />
          Run{selected.length > 0 ? ` (${selected.length})` : ""}
        </button>
      </div>
    </div>
  );
}
