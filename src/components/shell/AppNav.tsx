import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { FolioMark } from "@/components/brand/FolioMark";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/chat", label: "Chat" },
  { to: "/explain", label: "Explain" },
  { to: "/work", label: "Work" },
  { to: "/workbench", label: "Workbench" },
  { to: "/connectors", label: "Connectors" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppNav({ right }: { right?: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/50 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-5 py-3">
        <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
          <FolioMark className="h-8 w-8 transition-transform duration-500 group-hover:scale-110" />
          <span className="font-serif text-xl tracking-tight">Folio</span>
        </Link>

        <nav className="ml-4 hidden md:flex items-center gap-1 text-sm min-w-0">
          {LINKS.map(({ to, label }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative rounded-full px-3 py-1.5 transition-all duration-300",
                  active
                    ? "bg-foreground/10 font-medium text-foreground"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
                )}
              >
                {label}
                {active && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full rgb-blob opacity-90"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {right}
          {user && (
            <button
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="text-foreground/60 transition hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
