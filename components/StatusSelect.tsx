"use client";

import { PIPELINE_STATUSES, STATUS_COLORS, type PropertyStatus } from "@/lib/data";
import clsx from "clsx";

type Props = {
  value: PropertyStatus;
  onChange: (status: PropertyStatus) => void;
  size?: "sm" | "md";
};

export default function StatusSelect({ value, onChange, size = "sm" }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PropertyStatus)}
      className={clsx(
        "rounded-md border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500",
        STATUS_COLORS[value],
        size === "sm" ? "text-xs px-2 py-1 max-w-full" : "text-sm px-3 py-1.5"
      )}
      title="เปลี่ยนสถานะ"
    >
      {PIPELINE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
