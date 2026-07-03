"use client";

import type { CouncilMode } from "@/config/councilRoles";

const MODES: { id: CouncilMode; label: string; description: string }[] = [
  { id: "rapido", label: "Rapido", description: "Riesgos + Analista Critico. Bajo coste." },
  {
    id: "completo",
    label: "Consejo completo",
    description: "Riesgos, Critico, Creativo, Investigador, CFO y Moderador.",
  },
  {
    id: "debate",
    label: "Debate",
    description: "Primera ronda independiente, segunda ronda respondiendo a desacuerdos.",
  },
  { id: "experto", label: "Experto", description: "Eliges tu mismo que especialistas convocar." },
];

export default function ModeSelector({
  mode,
  onChange,
}: {
  mode: CouncilMode;
  onChange: (mode: CouncilMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          title={m.description}
          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            mode === m.id
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
          }`}
        >
          <div className="font-medium">{m.label}</div>
          <div
            className={`mt-0.5 text-xs ${mode === m.id ? "text-slate-300" : "text-slate-500"}`}
          >
            {m.description}
          </div>
        </button>
      ))}
    </div>
  );
}
