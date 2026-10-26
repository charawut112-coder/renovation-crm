"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChecklistPanel from "@/components/ChecklistPanel";
import LateBadge from "@/components/LateBadge";
import StatusChanger from "@/components/StatusChanger";
import { PIPELINE_STATUSES, STATUS_COLORS, formatPrice } from "@/lib/data";
import { STATUS_CHECKLIST, isChecklistItemSatisfied } from "@/lib/checklist";
import { loadMedia } from "@/lib/media";
import type { ChangeStatusResult } from "@/lib/pipeline";
import { loadPropertyViews, type PropertyView } from "@/lib/views";
import type { MediaFile } from "@/lib/media";

export default function PipelinePage() {
  const [rows, setRows] = useState<PropertyView[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  function refresh() {
    setRows(loadPropertyViews());
    setMedia(loadMedia());
    setReloadToken((n) => n + 1);
  }

  useEffect(() => {
    refresh();
  }, []);

  function onResult(result: ChangeStatusResult) {
    if (!result.ok) setBanner(result.error);
    else if (result.changed) setBanner(null);
  }

  return (
    <div className="p-6 h-screen overflow-hidden flex flex-col relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          ห้ามข้ามสถานะ · ติ๊ก checklist ก่อนไปขั้นถัดไป · เอกสาร/รูปต้องแนบไฟล์ · ย้อนขั้นต้องใส่เหตุผล
        </p>
      </div>

      {banner && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm">
          {banner}
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-4">
          {PIPELINE_STATUSES.map((status) => {
            const items = rows.filter((r) => r.property.status === status);
            return (
              <div key={status} className="w-72 flex-shrink-0">
                <div className={`rounded-t-lg px-3 py-2 text-xs font-semibold border-b ${STATUS_COLORS[status]}`}>
                  {status} <span className="opacity-70 font-normal">({items.length})</span>
                </div>
                <div className="bg-slate-100 rounded-b-lg p-2 min-h-[420px] space-y-2">
                  {items.map((row) => {
                    const p = row.property;
                    const required = STATUS_CHECKLIST[p.status] || [];
                    const files = media.filter((f) => f.propertyId === p.id);
                    const doneCount = required.filter((item) =>
                      isChecklistItemSatisfied(p.id, item, row.checklistDone, files)
                    ).length;
                    const open = expandedId === p.id;
                    return (
                      <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <Link href={`/properties/${p.id}`} className="font-medium text-sm text-brand-600 hover:underline">
                            {p.code}
                          </Link>
                          <div className="flex items-center gap-1">
                            <LateBadge late={row.timing.late} />
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                doneCount < required.length ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                              }`}
                            >
                              {doneCount < required.length ? `checklist ${doneCount}/${required.length}` : "พร้อมไปขั้นถัดไป"}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 truncate">{p.address}</div>
                        <div className="text-xs text-slate-500 truncate">{p.customerName}</div>
                        <div className="text-xs text-slate-400">{p.district}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{formatPrice(p.purchasePrice)}</span>
                          <span className="text-xs text-slate-400">
                            {row.timing.doneCount}/{row.timing.total} ขั้น
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.timing.late ? "bg-red-500" : "bg-brand-500"}`}
                            style={{ width: `${row.timing.progress}%` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : p.id)}
                          className="text-[11px] text-brand-600 hover:underline"
                        >
                          {open ? "ซ่อน Checklist" : "Checklist บังคับ"}
                        </button>
                        {open && (
                          <div className="border-t border-slate-100 pt-2">
                            <ChecklistPanel
                              propertyId={p.id}
                              status={p.status}
                              compact
                              reloadToken={reloadToken}
                              onChange={refresh}
                            />
                          </div>
                        )}
                        <StatusChanger
                          propertyId={p.id}
                          status={p.status}
                          onChanged={refresh}
                          onResult={onResult}
                        />
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
