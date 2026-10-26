"use client";

import { useState } from "react";
import StatusSelect from "@/components/StatusSelect";
import { PIPELINE_STATUSES, type PropertyStatus } from "@/lib/data";
import { changeStatus, type ChangeStatusResult } from "@/lib/pipeline";

export default function StatusChanger({
  propertyId,
  status,
  onChanged,
  onResult,
  size = "sm",
}: {
  propertyId: string;
  status: PropertyStatus;
  onChanged?: () => void;
  onResult?: (result: ChangeStatusResult) => void;
  size?: "sm" | "md";
}) {
  const [pendingBack, setPendingBack] = useState<PropertyStatus | null>(null);
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function flash(kind: "ok" | "err", text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), kind === "err" ? 7000 : 2800);
  }

  function apply(result: ChangeStatusResult) {
    onResult?.(result);
    if (!result.ok) {
      flash("err", result.error);
      return;
    }
    if (result.changed) {
      const warranty = result.handover ? ` · สร้าง Warranty ให้ ${result.handover.customerName}` : "";
      flash("ok", `${result.property.code}: ${result.fromStatus} → ${result.toStatus}${warranty}`);
      onChanged?.();
    }
  }

  function handleSelect(next: PropertyStatus) {
    if (next === status) return;
    const fromIdx = PIPELINE_STATUSES.indexOf(status);
    const toIdx = PIPELINE_STATUSES.indexOf(next);
    if (toIdx < fromIdx) {
      setPendingBack(next);
      setReason("");
      setModalError(null);
      return;
    }
    apply(changeStatus({ propertyId, toStatus: next }));
  }

  function confirmBack() {
    if (!pendingBack) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setModalError("กรุณาระบุเหตุผลในการย้อนสถานะ");
      return;
    }
    const result = changeStatus({ propertyId, toStatus: pendingBack, reason: trimmed });
    if (!result.ok) {
      setModalError(result.error);
      onResult?.(result);
      return;
    }
    setPendingBack(null);
    apply(result);
  }

  return (
    <>
      <StatusSelect value={status} onChange={handleSelect} sequentialOnly size={size} />
      {toast && (
        <div
          className={`fixed top-4 right-6 z-40 max-w-md text-sm px-4 py-2 rounded-lg shadow-lg ${
            toast.kind === "err" ? "bg-red-600 text-white" : "bg-brand-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}
      {pendingBack && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">ย้อนสถานะ</h3>
            <p className="text-sm text-slate-600">
              จาก <span className="font-medium">{status}</span> กลับไป{" "}
              <span className="font-medium">{pendingBack}</span>
            </p>
            <p className="text-xs text-slate-500">ต้องระบุเหตุผล — ระบบบันทึกลงประวัติสถานะทุกครั้ง</p>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="เช่น ลูกค้าขอแก้แบบ / งานยังไม่ผ่าน QC"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            {modalError && <p className="text-sm text-red-600">{modalError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingBack(null)}
                className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmBack}
                className="text-sm px-3 py-1.5 bg-brand-600 text-white rounded-lg"
              >
                ย้อนสถานะ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
