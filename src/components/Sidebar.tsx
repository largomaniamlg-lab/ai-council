"use client";

import { useState } from "react";
import type { Project, Session } from "@/lib/data";

export default function Sidebar({
  projects,
  supabaseConfigured,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  sessions,
  selectedSessionId,
  onSelectSession,
  onNewConsultation,
}: {
  projects: Project[];
  supabaseConfigured: boolean;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewConsultation: () => void;
}) {
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      await onCreateProject(newProjectName.trim());
      setNewProjectName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">AI Council</h1>
        <p className="text-xs text-slate-500">Consejo de IA - Presidente: tu</p>
      </div>

      {!supabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          Supabase no esta configurado. Puedes consultar al Consejo, pero los
          proyectos y sesiones no se guardaran. Revisa el README.
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="Nuevo proyecto..."
          disabled={!supabaseConfigured}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={!supabaseConfigured || creating}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          +
        </button>
      </form>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Proyectos
      </div>
      <ul className="mb-4 flex flex-col gap-1 overflow-y-auto">
        {projects.length === 0 && (
          <li className="text-sm text-slate-400">Sin proyectos todavia.</li>
        )}
        {projects.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelectProject(p.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedProjectId === p.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      {selectedProjectId && (
        <>
          <button
            onClick={onNewConsultation}
            className="mb-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            + Nueva consulta
          </button>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Historial de sesiones
          </div>
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {sessions.length === 0 && (
              <li className="text-sm text-slate-400">Sin sesiones todavia.</li>
            )}
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full truncate rounded-md px-3 py-2 text-left text-xs ${
                    selectedSessionId === s.id
                      ? "bg-slate-200 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title={s.title}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
