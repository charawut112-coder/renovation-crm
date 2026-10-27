"use client";

import { useEffect, useState } from "react";
import { QC_ITEMS, loadQc, saveQcItem } from "@/lib/qc";

export default function QcPanel({
  propertyId,
  compact = false,
  reloadToken = 0,
  onChange,
}: {
  propertyId: string;
  compact?: boolean;
  reloadToken?: number;
  onChange?: () => void;
}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecks(loadQc(propertyId));
  }, [propertyId, reloadToken]);

  const doneCount = QC_ITEMS.filter((item) => checks[item.id]).length;
  const complete = doneCount === QC_ITEMS.length;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>
          ผ่าน {doneCount}/{QC_ITEMS.length}
          {complete ? " · พร้อมสำหรับ checklist QC" : ""}
        </p>
      </div>
      <ul className="space-y-1">
        {QC_ITEMS.map((item) => {
          const passed = Boolean(checks[item.id]);
          return (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300"
                  checked={passed}
                  onChange={(event) => {
                    saveQcItem(propertyId, item.id, event.target.checked);
                    setChecks(loadQc(propertyId));
                    onChange?.();
                  }}
                />
                <span className={passed ? "text-slate-500 line-through" : "text-slate-700"}>
                  {item.label}
                  <span className="text-slate-400"> · {item.category}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
