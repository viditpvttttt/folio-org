import { usePages, useTasks } from "@/lib/workspace";
import { X, FileText, CheckCircle2, Circle, Clock } from "lucide-react";

export function DashboardPanel({ onClose }: { onClose: () => void }) {
  const { data: pages = [] } = usePages();
  const { data: tasks = [] } = useTasks();
  const done = tasks.filter((t) => t.status === "done").length;
  const doing = tasks.filter((t) => t.status === "doing").length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const recent = [...pages].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-stretch justify-end" onClick={onClose}>
      <div className="w-full max-w-3xl h-full bg-background border-l border-border shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Dashboard</h2>
            <p className="text-xs text-muted-foreground">A look at this week.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={<FileText className="h-4 w-4" />} label="Pages" value={pages.length} />
            <Stat icon={<Circle className="h-4 w-4" />} label="To do" value={todo} />
            <Stat icon={<Clock className="h-4 w-4" />} label="Doing" value={doing} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={done} />
          </div>

          <section>
            <h3 className="font-serif text-xl mb-3">Recent pages</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nothing yet. Add a page from the room.</p>
            ) : (
              <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {recent.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex items-center gap-3 bg-card">
                    <span className="text-lg">{p.icon}</span>
                    <span className="flex-1 truncate">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-serif text-xl mb-3">Quote of the room</h3>
            <blockquote className="font-serif italic text-2xl border-l-2 border-foreground pl-4">
              "First, solve the problem. Then, write the code."
              <footer className="not-italic text-sm text-muted-foreground mt-2 font-sans">— John Johnson</footer>
            </blockquote>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">{icon}{label}</div>
      <div className="font-serif text-3xl">{value}</div>
    </div>
  );
}
