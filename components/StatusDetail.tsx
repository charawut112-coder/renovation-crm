"use client";

import { useEffect, useState } from "react";
import ChecklistPanel from "@/components/ChecklistPanel";
import { canAdvance, loadChecklistDone, loadLogs, type StatusLog } from "@/lib/checklist";
import { PIPELINE_STATUSES, loadProperties, type PropertyStatus } from "@/lib/data";
import { formatDateTime } from "@/lib/timeline";

/** Checklist + ประวัติสถานะ ที่ใช้ร่วมกันทุกจุดที่เปลี่ยนสถานะได้ */
export default function StatusDetail({
  propertyId,
  status,
  onChange,
}: {
  propertyId: string;
  status: PropertyStatus;
  onChange?: () => void;
}) {
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const isLast = PIPELINE_STATUSES.indexOf(status) === PIPELINE_STATUSES.length - 1;

  function reload() {
    setLogs(loadLogs().filter((log) => log.propertyId === propertyId).slice(0, 6));
    const property = loadProperties().find((item) => item.id === propertyId);
    if (!property) {
      setMissing([]);
      return;
    }
    const result = canAdvance({ ...property, checklistDone: loadChecklistDone(propertyId) });
    setMissing(result.ok ? [] : result.missingLabels);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, status, tick]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h3 className="text-sm font-medium text-slate-800">Checklist ก่อนเลื่อนขั้น</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
          {isLast
            ? "สถานะสุดท้าย — รายการนี้บันทึกงานหลังการขาย และผูกกับ Warranty, Follow-up, Ticket"
            : "ไปขั้นถัดไปได้เมื่อรายการครบ เอกสารและรูปต้องมีไฟล์แนบ ระบบบันทึก log ทุกครั้ง"}
        </p>
        {missing.length > 0 ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
            ยังเลื่อนสถานะไม่ได้: {missing.join(", ")}
          </p>
        ) : (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
            checklist ครบแล้ว
          </p>
        )}
        <ChecklistPanel
          propertyId={propertyId}
          status={status}
          reloadToken={tick}
          onChange={() => {
            setTick((value) => value + 1);
            onChange?.();
          }}
        />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <h3 className="text-sm font-medium text-slate-800 mb-2">ประวัติการเปลี่ยนสถานะ</h3>
        {logs.length === 0 && <p className="text-xs text-slate-400">ยังไม่มีประวัติ</p>}
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log.id} className="py-2 text-xs">
              <div className="text-slate-800">
                {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}
              </div>
              <div className="text-slate-500 mt-0.5">
                {formatDateTime(log.createdAt)} · {log.changedBy}
                {(log.reason || log.note) && ` · ${log.reason || log.note}`}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
