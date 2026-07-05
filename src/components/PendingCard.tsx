"use client";

import type { CouncilRole } from "@/config/councilRoles";

export default function PendingCard({ role }: { role: CouncilRole }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: role.color }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: role.color }}
          />
        </span>
        <span className="font-semibold text-slate-800">{role.name}</span>
      </div>
      <p className="text-sm italic text-slate-400">{role.thinkingLabel}</p>
    </div>
  );
}
