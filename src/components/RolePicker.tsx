"use client";

import { getSpecialistRoles } from "@/config/councilRoles";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RolePicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (roleId: string) => void;
}) {
  const roles = getSpecialistRoles();
  const { tRole } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => {
        const active = selected.includes(role.id);
        const translated = tRole(role.id);
        return (
          <button
            key={role.id}
            type="button"
            title={translated?.shortDescription ?? role.shortDescription}
            onClick={() => onToggle(role.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active ? "" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300"
            }`}
            style={active ? { backgroundColor: role.color, borderColor: role.color, color: "white" } : undefined}
          >
            {translated?.name ?? role.name}
          </button>
        );
      })}
    </div>
  );
}
