"use client";

import { useEffect, useState } from "react";
import {
  PIPELINE_STATUSES,
  STATUS_COLORS,
  loadProperties,
  saveProperties,
  progressFromStatus,
  formatPrice,
  type Property,
  type PropertyStatus,
} from "@/lib/data";
import {
  STATUS_CHECKLIST,
  canAdvance,
  appendStatusLog,
} from "@/lib/checklist";
import { createAfterSalesPackage } from "@/lib/aftersales";
import StatusSelect from "@/components/StatusSelect";

type PropWithCheck = Property & { checklistDone?: string[] };

const CHECK_KEY = "renovation-crm-checklist-v1";

function loadChecklistMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveChecklistMap(map: Record<string, string[]>) {
  localStorage.setItem(CHECK_KEY, JSON.stringify(map));
}

export default function PipelinePage() {
  const [properties, setProperties] = useState<PropWithCheck[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const props = loadProperties() as PropWithCheck[];
    const map = loadChecklistMap();
    setProperties(props.map((p) => ({ ...p, checklistDone: map[p.id] || [] })));
  }, []);

  function persist(next: PropWithCheck[]) {
    saveProperties(next);
    const map: Record<string, string[]> = {};
    next.forEach((p) => {
      map[p.id] = p.checklistDone || [];
    });
    saveChecklistMap(map);
  }

  function toggleChecklist(propertyId: string, item: string) {
    setProperties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== propertyId) return p;
        const done = p.checklistDone || [];
        const checklistDone = done.includes(item)
          ? done.filter((x) => x !== item)
          : [...done, item];
        return { ...p, checklistDone };
      });
      persist(next);
      return next;
    });
  }

  function updateStatus(id: string, status: PropertyStatus) {
    const property = properties.find((p) => p.id === id);
    if (!property || status === property.status) return;

    const currentIdx = PIPELINE_STATUSES.indexOf(property.status);
    const nextIdx = PIPELINE_STATUSES.indexOf(status);
    if (nextIdx > currentIdx) {
      const { ok, missing } = canAdvance(property);
      if (!ok) {
        setError(`ยังเปลี่ยนไม่ได้ — checklist ยังไม่ครบ: ${missing.join(", ")}`);
        setTimeout(() => setError(null), 4000);
        return;
      }
    }

    setProperties((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p;
        appendStatusLog(p, p.status, status);
        if (status === "ส่งมอบให้ลูกค้า" || status === "หลังการขาย") {
          createAfterSalesPackage({
            propertyId: p.id,
            propertyCode: p.code,
            customerName: "ลูกค้าผู้รับมอบ",
          });
        }
        return {
          ...p,
          status,
          progress: progressFromStatus(status),
          checklistDone: [] as string[],
        };
      });
      persist(next);
      setToast(`${property.code}: ${property.status} → ${status}`);
      setTimeout(() => setToast(null), 2800);
      return next;
    });
  }

  return (
    <div className="p-6 h-screen overflow-hidden flex flex-col relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          ตามสเปก: ห้ามข้ามสถานะ · ติ๊ก Checklist ก่อนไปขั้นถัดไป · บันทึก Log
        </p>
      </div>

      {toast && (
        <div className="absolute top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          ✓ {toast}
        </div>
      )}
      {error && (
        <div className="absolute top-4 right-6 z-20 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-md">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {PIPELINE_STATUSES.map((status) => {
            const items = properties.filter((p) => p.status === status);
            return (
              <div key={status} className="w-72 flex-shrink-0">
                <div className={`rounded-t-lg px-3 py-2 text-xs font-semibold border-b ${STATUS_COLORS[status]}`}>
                  {status} <span className="opacity-70 font-normal">({items.length})</span>
                </div>
                <div className="bg-slate-100 rounded-b-lg p-2 min-h-[420px] space-y-2">
                  {items.map((p) => {
                    const required = STATUS_CHECKLIST[p.status] || [];
                    const done = p.checklistDone || [];
                    const missing = required.filter((i) => !done.includes(i));
                    const open = expandedId === p.id;
                    return (
                      <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-medium text-sm text-brand-600">{p.code}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${missing.length ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                            {missing.length ? `checklist ${done.length}/${required.length}` : "พร้อมไปขั้นถัดไป"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 truncate">{p.address}</div>
                        <div className="text-xs text-slate-400">{p.district}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{formatPrice(p.purchasePrice)}</span>
                          <span className="text-xs text-slate-400">{p.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                        <button type="button" onClick={() => setExpandedId(open ? null : p.id)} className="text-[11px] text-brand-600 hover:underline">
                          {open ? "ซ่อน Checklist" : "Checklist บังคับ"}
                        </button>
                        {open && (
                          <ul className="space-y-1 border-t border-slate-100 pt-2">
                            {required.map((item) => {
                              const checked = done.includes(item);
                              return (
                                <li key={item}>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input type="checkbox" checked={checked} onChange={() => toggleChecklist(p.id, item)} className="rounded border-slate-300" />
                                    <span className={checked ? "text-slate-500 line-through" : "text-slate-700"}>{item}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <StatusSelect value={p.status} onChange={(s) => updateStatus(p.id, s)} sequentialOnly />
                      </div>
                    );
                  })}
                  {items.length === 0 && <div className="text-xs text-slate-400 text-center py-10">ไม่มีบ้าน</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
