import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type Task } from "@/lib/workspace";
import { X, Plus, Trash2 } from "lucide-react";

const COLUMNS: { id: "todo" | "doing" | "done"; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

export function KanbanPanel({ onClose }: { onClose: () => void }) {
  const { data: tasks = [] } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  function add() {
    if (!draft.trim()) return;
    create.mutate({ title: draft.trim() });
    setDraft("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-5xl h-full bg-background border-l border-border shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Tasks</h2>
            <p className="text-xs text-muted-foreground">Drag between columns. Autosaves.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
        </header>

        <div className="px-6 py-3 border-b border-border flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New task…"
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={add} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) update.mutate({ id: dragId, status: col.id });
                  setDragId(null);
                }}
                className="rounded-lg bg-secondary/40 p-3 min-h-[300px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-serif text-lg">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <TaskCard key={t.id} task={t} onDragStart={() => setDragId(t.id)}
                      onDelete={() => del.mutate(t.id)}
                      onEdit={(title) => update.mutate({ id: t.id, title })} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onDragStart, onDelete, onEdit }: {
  task: Task;
  onDragStart: () => void;
  onDelete: () => void;
  onEdit: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.title);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group rounded-md bg-card border border-border p-3 text-sm cursor-grab active:cursor-grabbing hover:shadow-md transition"
    >
      <div className="flex items-start gap-2">
        {editing ? (
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
            onBlur={() => { onEdit(val); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onEdit(val); setEditing(false); } }}
            className="flex-1 bg-transparent focus:outline-none" />
        ) : (
          <div onClick={() => setEditing(true)} className="flex-1">{task.title}</div>
        )}
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
