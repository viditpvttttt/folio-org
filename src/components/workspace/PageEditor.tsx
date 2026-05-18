import { useEffect, useState } from "react";
import type { Page, Block } from "@/lib/workspace";
import { useUpdatePage, useDeletePage } from "@/lib/workspace";
import { X, Trash2, Plus, Heading1, Heading2, Type, CheckSquare, Quote, Minus } from "lucide-react";

interface Props {
  page: Page;
  onClose: () => void;
}

function asBlocks(content: unknown): Block[] {
  if (!Array.isArray(content)) return [];
  return content as Block[];
}

export function PageEditor({ page, onClose }: Props) {
  const update = useUpdatePage();
  const del = useDeletePage();
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon);
  const [blocks, setBlocks] = useState<Block[]>(asBlocks(page.content));

  // Debounced autosave
  useEffect(() => {
    const t = setTimeout(() => {
      update.mutate({ id: page.id, title, icon, content: blocks as never });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, icon, blocks]);

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } as Block : b)));
  }
  function addBlock(type: Block["type"]) {
    const base = { id: crypto.randomUUID() };
    const nb: Block =
      type === "todo" ? { ...base, type, text: "", done: false } :
      type === "divider" ? { ...base, type } :
      { ...base, type, text: "" };
    setBlocks((bs) => [...bs, nb]);
  }
  function removeBlock(id: string) {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-background border-l border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <input
              value={icon} onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              className="w-10 text-2xl text-center bg-transparent focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">Page · autosaved</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { if (confirm("Delete this page?")) { del.mutate(page.id); onClose(); } }}
              className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
            ><Trash2 className="h-4 w-4" /></button>
            <button onClick={onClose} className="p-2 rounded hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full font-serif text-5xl bg-transparent focus:outline-none mb-6 placeholder:text-muted-foreground/40"
          />
          <div className="space-y-2">
            {blocks.map((b) => (
              <BlockRow key={b.id} block={b} onChange={(p) => updateBlock(b.id, p)} onRemove={() => removeBlock(b.id)} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-1">
            <BlockButton icon={<Heading1 className="h-3.5 w-3.5" />} label="H1" onClick={() => addBlock("h1")} />
            <BlockButton icon={<Heading2 className="h-3.5 w-3.5" />} label="H2" onClick={() => addBlock("h2")} />
            <BlockButton icon={<Type className="h-3.5 w-3.5" />} label="Text" onClick={() => addBlock("text")} />
            <BlockButton icon={<CheckSquare className="h-3.5 w-3.5" />} label="To-do" onClick={() => addBlock("todo")} />
            <BlockButton icon={<Quote className="h-3.5 w-3.5" />} label="Quote" onClick={() => addBlock("quote")} />
            <BlockButton icon={<Minus className="h-3.5 w-3.5" />} label="Divider" onClick={() => addBlock("divider")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-border hover:bg-secondary">
      {icon} {label}
    </button>
  );
}

function BlockRow({ block, onChange, onRemove }: { block: Block; onChange: (p: Partial<Block>) => void; onRemove: () => void }) {
  return (
    <div className="group flex items-start gap-2">
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 mt-1.5 text-muted-foreground hover:text-destructive transition">
        <X className="h-3 w-3" />
      </button>
      <div className="flex-1">
        {block.type === "h1" && (
          <input value={block.text} onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading 1" className="w-full font-serif text-3xl bg-transparent focus:outline-none placeholder:text-muted-foreground/40" />
        )}
        {block.type === "h2" && (
          <input value={block.text} onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Heading 2" className="w-full font-serif text-2xl bg-transparent focus:outline-none placeholder:text-muted-foreground/40" />
        )}
        {block.type === "text" && (
          <textarea value={block.text} onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Start typing…" rows={2}
            className="w-full bg-transparent focus:outline-none resize-none leading-relaxed placeholder:text-muted-foreground/40" />
        )}
        {block.type === "quote" && (
          <textarea value={block.text} onChange={(e) => onChange({ text: e.target.value })}
            placeholder="A quote…" rows={2}
            className="w-full font-serif italic text-lg border-l-2 border-foreground pl-4 bg-transparent focus:outline-none resize-none placeholder:text-muted-foreground/40" />
        )}
        {block.type === "todo" && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={block.done} onChange={(e) => onChange({ done: e.target.checked })}
              className="mt-1.5 accent-foreground" />
            <input value={block.text} onChange={(e) => onChange({ text: e.target.value })}
              placeholder="To-do"
              className={`flex-1 bg-transparent focus:outline-none ${block.done ? "line-through text-muted-foreground" : ""}`} />
          </label>
        )}
        {block.type === "divider" && <hr className="my-3 border-border" />}
      </div>
    </div>
  );
}
