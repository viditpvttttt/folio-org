import { Link } from "@tanstack/react-router";
import { Wand2 } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Showcase", "Voice", "Workbench", "Skills"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Resources",
    links: ["Docs", "Help", "Community", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "Cookies"],
  },
];

/**
 * Apple-inspired premium multi-column footer.
 */
export function PremiumFooter() {
  return (
    <footer className="border-t border-border/60 bg-paper-dim/20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="font-serif text-2xl tracking-tight">Folio</Link>
            <p className="mt-3 max-w-[200px] text-sm text-muted-foreground leading-relaxed">
              The assistant that lives in one calm place.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground/60">
              <Wand2 className="h-3.5 w-3.5" />
              <span>Everyday assistant</span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            © 2026 Folio. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Made with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
