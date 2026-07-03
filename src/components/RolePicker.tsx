"use client";

import { getSpecialistRoles } from "@/config/councilRoles";

export default function RolePicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (roleId: string) => void;
}) {
  const roles = getSpecialistRoles();

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => {
        const active = selected.includes(role.id);
        return (
          <button
            key={role.id}
            type="button"
            title={role.shortDescription}
            onClick={() => onToggle(role.id)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? { backgroundColor: role.color, borderColor: role.color, color: "white" }
                : { borderColor: "#cbd5e1", color: "#334155" }
            }
          >
            {role.name}
          </button>
        );
      })}
    </div>
  );
}
