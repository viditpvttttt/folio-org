import { useState } from "react";
import type { ComponentType } from "react";
import { Trash2, X, Sparkles, ChevronDown, FileText, Bug, Search } from "lucide-react";

export type BulkFileActionId = "document" | "fix" | "review";

/** AI actions that can be applied across every selected file at once. */
export const FILE_ACTIONS: {
  id: BulkFileActionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  prompt: string;
}[] = [
  {
    id: "document",
    label: "Document all",
    icon: FileText,
    prompt:
      "Add clear comments/JSDoc to each of the following files. Read each file first, then write it back with writeFile. Work through every file, then summarise what you added.",
  },
  {
    id: "fix",
    label: "Fix bugs in all",
    icon: Bug,
    prompt:
      "Review each of the following files for bugs and fix them. Read each file first, then apply the fixes with writeFile. List the bugs you fixed per file.",
  },
  {
    id: "review",
    label: "Review all",
    icon: Search,
    prompt:
      "Review each of the following files and report issues, bugs and concrete improvement suggestions, grouped per file. Read every file, but do not modify anything.",
  },
];

/**
 * Floating bulk-action bar for the file tree — appears while files are
 * checked. Supports one-request bulk AI updates across all selected files,
 * bulk delete, and clearing the selection.
 */
export function FilesBulkBar({
  count,
  onAiAction,
  onDelete,
  onClear,
}: {
  count: number;
  onAiAction: (id: BulkFileActionId) => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-1 mb-2 flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-2 py-1.5 text-[11px] shadow-lg backdrop-blur-xl animate-in slide-in-from-top-2 fade-in duration-300">
      <span className="shrink-0 font-medium">{count} selected</span>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1 transition hover:bg-foreground/10"
          title="AI actions across selected files"
        >
          <Sparkles className="h-3 w-3" /> AI
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border/60 bg-background/95 p-1 shadow-xl backdrop-blur-xl">
              {FILE_ACTIONS.map(({ id, label, icon: Icon, prompt }) => (
                <button
                  key={id}
                  title={prompt}
                  onClick={() => {
                    onAiAction(id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-foreground/10"
                >
                  <Icon className="h-3 w-3 shrink-0" /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1 transition hover:bg-destructive/10 hover:text-destructive"
        title={`Delete ${count} file${count === 1 ? "" : "s"}`}
      >
        <Trash2 className="h-3 w-3" /> Delete
      </button>
      <button
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
        title="Clear selection"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
