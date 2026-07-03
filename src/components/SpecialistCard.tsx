"use client";

import { getRoleById } from "@/config/councilRoles";
import type { AgentResponse } from "@/lib/types";

export default function SpecialistCard({ response }: { response: AgentResponse }) {
  const role = getRoleById(response.roleId);
  const color = role?.color ?? "#334155";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-semibold text-slate-800">{response.roleName}</span>
          {response.round > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              ronda {response.round}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {response.provider} / {response.model}
        </span>
      </div>
      {response.error ? (
        <p className="text-sm text-red-600">{response.error}</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{response.response}</p>
      )}
    </div>
  );
}
