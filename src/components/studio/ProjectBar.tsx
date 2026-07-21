"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StudioProject } from "@/lib/types";
import { FolderOpen, Save, FilePlus2, Trash2, Mic2 } from "lucide-react";

export function ProjectBar({
  projectName,
  onRename,
  isSaving,
  onSave,
  onNew,
  savedProjects,
  onRefreshList,
  onOpen,
  onDelete,
}: {
  projectName: string;
  onRename: (name: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onNew: () => void;
  savedProjects: StudioProject[];
  onRefreshList: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [browserOpen, setBrowserOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-3 sm:px-6">
      <Mic2 className="text-fuchsia-400" size={20} />
      <input
        value={projectName}
        onChange={(e) => onRename(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-neutral-100 outline-none sm:max-w-xs"
      />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNew}>
          <FilePlus2 size={14} /> New
        </Button>
        <Button variant="secondary" size="sm" onClick={onSave} disabled={isSaving}>
          <Save size={14} /> {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setBrowserOpen((v) => !v);
            onRefreshList();
          }}
        >
          <FolderOpen size={14} /> Sessions
        </Button>
      </div>

      {browserOpen && (
        <div className="absolute top-full right-4 z-20 mt-1 w-80 rounded-lg border border-neutral-800 bg-neutral-900 p-2 shadow-xl sm:right-6">
          {savedProjects.length === 0 ? (
            <p className="p-3 text-sm text-neutral-500">No saved sessions yet.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {savedProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-800">
                  <button
                    className="min-w-0 flex-1 truncate text-left text-sm text-neutral-200"
                    onClick={() => {
                      onOpen(p.id);
                      setBrowserOpen(false);
                    }}
                  >
                    {p.name}
                    <span className="ml-2 text-xs text-neutral-500">{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="rounded p-1 text-neutral-500 hover:text-red-400"
                    aria-label="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
