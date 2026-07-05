"use client";

import { useState } from "react";
import { getModeratorRole } from "@/config/councilRoles";
import PendingCard from "@/components/PendingCard";
import type { CouncilMinutes, PresidentDecision, SessionOutcome } from "@/lib/types";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Ninguno</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ActaPanel({
  minutes,
  isGeneratingMinutes,
  sessionId,
  supabaseConfigured,
  initialDecision,
  initialOutcome,
  onSaveDecision,
  onSaveOutcome,
}: {
  minutes: (CouncilMinutes & { markdown: string }) | null;
  isGeneratingMinutes: boolean;
  sessionId: string | null;
  supabaseConfigured: boolean;
  initialDecision: PresidentDecision | null;
  initialOutcome: SessionOutcome | null;
  onSaveDecision: (decision: PresidentDecision) => Promise<void>;
  onSaveOutcome: (outcome: SessionOutcome) => Promise<void>;
}) {
  const [finalDecision, setFinalDecision] = useState(initialDecision?.finalDecision ?? "");
  const [rationale, setRationale] = useState(initialDecision?.rationale ?? "");
  const [expectedResult, setExpectedResult] = useState(initialDecision?.expectedResult ?? "");
  const [decisionSaved, setDecisionSaved] = useState(Boolean(initialDecision));
  const [savingDecision, setSavingDecision] = useState(false);

  const [showOutcomeForm, setShowOutcomeForm] = useState(Boolean(initialOutcome));
  const [actualResult, setActualResult] = useState(initialOutcome?.actualResult ?? "");
  const [whatWorked, setWhatWorked] = useState(initialOutcome?.whatWorked ?? "");
  const [whatFailed, setWhatFailed] = useState(initialOutcome?.whatFailed ?? "");
  const [lessons, setLessons] = useState(initialOutcome?.lessons ?? "");
  const [outcomeSaved, setOutcomeSaved] = useState(Boolean(initialOutcome));
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSaveDecision() {
    if (!finalDecision.trim()) return;
    setSavingDecision(true);
    try {
      await onSaveDecision({ finalDecision, rationale, expectedResult });
      setDecisionSaved(true);
    } finally {
      setSavingDecision(false);
    }
  }

  async function handleSaveOutcome() {
    setSavingOutcome(true);
    try {
      await onSaveOutcome({ actualResult, whatWorked, whatFailed, lessons });
      setOutcomeSaved(true);
    } finally {
      setSavingOutcome(false);
    }
  }

  function handleCopy() {
    if (!minutes) return;
    navigator.clipboard.writeText(minutes.markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleExport() {
    if (!minutes) return;
    const blob = new Blob([minutes.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acta-consejo.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:w-96 md:shrink-0 md:rounded-none md:border-y-0 md:border-r-0 md:border-l md:border-slate-200 md:shadow-none md:overflow-y-auto">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Acta del Consejo
      </h2>

      {isGeneratingMinutes && <PendingCard role={getModeratorRole()} />}

      {!isGeneratingMinutes && !minutes && (
        <p className="text-sm text-slate-400">
          Aqui aparecera el acta final una vez el Consejo responda.
        </p>
      )}

      {minutes && (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              {copied ? "Copiado!" : "Copiar Markdown"}
            </button>
            <button
              onClick={handleExport}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              Exportar .md
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Resumen
            </h3>
            <p className="mt-1 text-sm text-slate-700">{minutes.summary || "Sin resumen"}</p>
          </div>

          <Section title="Acuerdos" items={minutes.agreements} />
          <Section title="Desacuerdos" items={minutes.disagreements} />
          <Section title="Riesgos" items={minutes.risks} />
          <Section title="Preguntas abiertas" items={minutes.openQuestions} />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recomendacion
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              {minutes.recommendation || "Sin recomendacion"}
            </p>
          </div>

          <hr className="border-slate-200" />

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Decision del Presidente
            </h3>
            <textarea
              value={finalDecision}
              onChange={(e) => setFinalDecision(e.target.value)}
              placeholder="Tu decision final..."
              rows={3}
              className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
            />
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Razonamiento..."
              rows={2}
              className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
            />
            <textarea
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Resultado esperado..."
              rows={2}
              className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
            />
            <button
              onClick={handleSaveDecision}
              disabled={!finalDecision.trim() || savingDecision}
              className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {decisionSaved ? "Decision guardada ✓" : savingDecision ? "Guardando..." : "Guardar decision"}
            </button>
            {!sessionId && (
              <p className="mt-1 text-xs text-amber-700">
                {supabaseConfigured
                  ? "Esta sesion no se ha guardado en un proyecto, la decision no se persistira."
                  : "Supabase no configurado: la decision no se persistira, solo queda en pantalla."}
              </p>
            )}
          </div>

          {decisionSaved && (
            <div>
              {!showOutcomeForm ? (
                <button
                  onClick={() => setShowOutcomeForm(true)}
                  className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  Registrar resultado real (mas adelante)
                </button>
              ) : (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resultado y aprendizajes
                  </h3>
                  <textarea
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    placeholder="Que ocurrio en la realidad..."
                    rows={2}
                    className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                  <textarea
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                    placeholder="Que funciono..."
                    rows={2}
                    className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                  <textarea
                    value={whatFailed}
                    onChange={(e) => setWhatFailed(e.target.value)}
                    placeholder="Que fallo..."
                    rows={2}
                    className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                  <textarea
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    placeholder="Aprendizajes para el proximo Consejo..."
                    rows={2}
                    className="mb-2 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                  <button
                    onClick={handleSaveOutcome}
                    disabled={savingOutcome}
                    className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {outcomeSaved
                      ? "Resultado guardado ✓"
                      : savingOutcome
                        ? "Guardando..."
                        : "Guardar resultado"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
