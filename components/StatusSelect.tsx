"use client";

import { PIPELINE_STATUSES, STATUS_COLORS, type PropertyStatus } from "@/lib/data";
import clsx from "clsx";

function allowedNextStatuses(current: PropertyStatus): PropertyStatus[] {
  const i = PIPELINE_STATUSES.indexOf(current);
  const allowed: PropertyStatus[] = [current];
  if (i > 0) allowed.push(PIPELINE_STATUSES[i - 1]);
  if (i >= 0 && i < PIPELINE_STATUSES.length - 1) allowed.push(PIPELINE_STATUSES[i + 1]);
  return allowed;
}

type Props = {
  value: PropertyStatus;
  onChange: (status: PropertyStatus) => void;
  sequentialOnly?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
};

export default function StatusSelect({
  value,
  onChange,
  sequentialOnly = true,
  disabled = false,
  size = "sm",
}: Props) {
  const options = sequentialOnly ? allowedNextStatuses(value) : PIPELINE_STATUSES;

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PropertyStatus)}
      className={clsx(
        "rounded-md border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed",
        STATUS_COLORS[value],
        size === "sm" ? "text-xs px-2 py-1 max-w-full" : "text-sm px-3 py-1.5"
      )}
      title={sequentialOnly ? "เปลี่ยนได้ทีละ 1 สถานะ (ตามสเปก)" : "เปลี่ยนสถานะ"}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
