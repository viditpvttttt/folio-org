import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scene3D } from "@/components/workspace/Scene3D";
import { PageEditor } from "@/components/workspace/PageEditor";
import { KanbanPanel } from "@/components/workspace/KanbanPanel";
import { DashboardPanel } from "@/components/workspace/DashboardPanel";
import { usePages, useTasks, useCreatePage, type Page, useProfile } from "@/lib/workspace";
import { useAuth } from "@/hooks/use-auth";
import { Plus, LogOut, LayoutDashboard, KanbanSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { data: pages = [] } = usePages();
  const { data: tasks = [] } = useTasks();
  const { data: profile } = useProfile();
  const { signOut } = useAuth();
  const createPage = useCreatePage();
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showKanban, setShowKanban] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Re-resolve selected page when pages refetch (after autosave)
  useEffect(() => {
    if (selectedPage) {
      const fresh = pages.find((p) => p.id === selectedPage.id);
      if (fresh && fresh.updated_at !== selectedPage.updated_at) setSelectedPage(fresh);
    }
  }, [pages, selectedPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") createPage.mutate(undefined);
      if (e.key === "Escape") { setSelectedPage(null); setShowKanban(false); setShowDashboard(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createPage]);

  const tasksSummary = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <Scene3D
        pages={pages}
        tasksSummary={tasksSummary}
        onSelectPage={setSelectedPage}
        onOpenKanban={() => setShowKanban(true)}
        onOpenDashboard={() => setShowDashboard(true)}
      />

      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-10 px-6 py-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="font-serif text-2xl">Folio</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {profile?.display_name ?? "your room"}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <ToolbarButton onClick={() => setShowDashboard(true)} icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <ToolbarButton onClick={() => setShowKanban(true)} icon={<KanbanSquare className="h-4 w-4" />} label="Tasks" />
          <ToolbarButton onClick={() => createPage.mutate(undefined)} icon={<Plus className="h-4 w-4" />} label="New page" primary />
          <button onClick={signOut} className="p-2 rounded hover:bg-card/80 transition" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-muted-foreground bg-card/70 backdrop-blur px-3 py-1.5 rounded-full border border-border">
        Drag to rotate · Scroll to zoom · <kbd className="rounded border border-border px-1">N</kbd> to add a page
      </div>

      {selectedPage && <PageEditor page={selectedPage} onClose={() => setSelectedPage(null)} />}
      {showKanban && <KanbanPanel onClose={() => setShowKanban(false)} />}
      {showDashboard && <DashboardPanel onClose={() => setShowDashboard(false)} />}
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, primary }: {
  icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md transition ${
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "bg-card/80 backdrop-blur border border-border hover:bg-card"
      }`}
    >
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}
