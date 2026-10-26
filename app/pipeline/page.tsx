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
import StatusSelect from "@/components/StatusSelect";

export default function PipelinePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

  function updateStatus(id: string, status: PropertyStatus) {
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, status, progress: progressFromStatus(status) }
          : p
      );
      saveProperties(next);
      const code = next.find((p) => p.id === id)?.code;
      setToast(`${code} → ${status}`);
      setTimeout(() => setToast(null), 2500);
      return next;
    });
  }

  return (
    <div className="p-6 h-screen overflow-hidden flex flex-col relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          เปลี่ยนสถานะได้จาก dropdown บนการ์ด · บันทึกในเบราว์เซอร์อัตโนมัติ
        </p>
      </div>

      {toast && (
        <div className="absolute top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          อัปเดตแล้ว: {toast}
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {PIPELINE_STATUSES.map((status) => {
            const items = properties.filter((p) => p.status === status);
            return (
              <div key={status} className="w-64 flex-shrink-0">
                <div
                  className={`rounded-t-lg px-3 py-2 text-xs font-semibold border-b ${STATUS_COLORS[status]}`}
                >
                  {status}{" "}
                  <span className="opacity-70 font-normal">({items.length})</span>
                </div>
                <div className="bg-slate-100 rounded-b-lg p-2 min-h-[420px] space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 space-y-2"
                    >
                      <div className="font-medium text-sm text-brand-600">
                        {p.code}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {p.address}
                      </div>
                      <div className="text-xs text-slate-400">{p.district}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">
                          {formatPrice(p.purchasePrice)}
                        </span>
                        <span className="text-xs text-slate-400">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <StatusSelect
                        value={p.status}
                        onChange={(s) => updateStatus(p.id, s)}
                      />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-10">
                      ไม่มีบ้าน
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
