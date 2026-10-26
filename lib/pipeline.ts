import { appendStatusLog, canAdvance, loadChecklistDone, saveChecklistDone } from "./checklist";
import {
  PIPELINE_STATUSES,
  loadProperties,
  saveProperties,
  type Property,
  type PropertyStatus,
} from "./data";
import { analyzeTimeline, applyStatusMoveToTimeline } from "./timeline";

export type ChangeStatusInput = {
  propertyId: string;
  toStatus: PropertyStatus;
  /** บังคับเมื่อย้อนสถานะ — เก็บลง status log */
  reason?: string;
  changedBy?: string;
};

export type ChangeStatusResult =
  | {
      ok: true;
      changed: boolean;
      property: Property;
      fromStatus: PropertyStatus;
      toStatus: PropertyStatus;
      /** มีค่าเมื่อ saveProperties สร้างแพ็กเกจหลังการขายในครั้งนี้ */
      handover?: { propertyId: string; propertyCode: string; customerName: string };
    }
  | {
      ok: false;
      error: string;
      missing?: string[];
    };

export type StatusMoveDecision =
  | { ok: true; direction: "forward" | "backward" | "same" }
  | { ok: false; error: string };

/** กฎเปลี่ยนสถานะล้วน ๆ (ไม่เขียน storage) — ใช้ร่วมกับ changeStatus */
export function statusMoveDecision(params: {
  from: PropertyStatus;
  to: PropertyStatus;
  missingLabels: string[];
  reason?: string;
}): StatusMoveDecision {
  if (params.from === params.to) return { ok: true, direction: "same" };
  const fromIdx = PIPELINE_STATUSES.indexOf(params.from);
  const toIdx = PIPELINE_STATUSES.indexOf(params.to);
  if (fromIdx < 0 || toIdx < 0) return { ok: false, error: "สถานะไม่ถูกต้อง" };
  if (Math.abs(toIdx - fromIdx) > 1) {
    return {
      ok: false,
      error: `ไม่สามารถข้ามสถานะได้ — ต้องเปลี่ยนทีละขั้น (ตอนนี้อยู่ที่「${params.from}」)`,
    };
  }
  if (toIdx > fromIdx && params.missingLabels.length > 0) {
    return {
      ok: false,
      error: `ยังเปลี่ยนสถานะไม่ได้ — checklist ยังไม่ครบ: ${params.missingLabels.join(", ")}`,
    };
  }
  if (toIdx < fromIdx && !(params.reason || "").trim()) {
    return { ok: false, error: "กรุณาระบุเหตุผลในการย้อนสถานะ" };
  }
  return { ok: true, direction: toIdx > fromIdx ? "forward" : "backward" };
}

/**
 * ทางเดียวที่ใช้เปลี่ยนสถานะบ้าน
 * ไปข้างหน้าต้อง checklist ครบ (รายการเอกสาร/รูปต้องมีไฟล์แนบ)
 * ย้อนกลับต้องมีเหตุผล
 * บันทึก log ทุกครั้ง แล้วค่อย saveProperties เป็นขั้นสุดท้าย
 * เพื่อให้การเข้าสู่ส่งมอบ/หลังการขายไปสร้างแพ็กเกจหลังการขาย
 */
export function changeStatus(input: ChangeStatusInput): ChangeStatusResult {
  if (typeof window === "undefined") {
    return { ok: false, error: "เปลี่ยนสถานะได้เฉพาะบนเบราว์เซอร์" };
  }
  const properties = loadProperties();
  const property = properties.find((p) => p.id === input.propertyId);
  if (!property) return { ok: false, error: "ไม่พบบ้านหลังนี้ในระบบ" };

  const checklistDone = loadChecklistDone(property.id);
  const advance = canAdvance({ ...property, checklistDone });
  const decision = statusMoveDecision({
    from: property.status,
    to: input.toStatus,
    missingLabels: advance.missingLabels,
    reason: input.reason,
  });
  if (!decision.ok) {
    return { ok: false, error: decision.error, missing: advance.missing };
  }
  if (decision.direction === "same") {
    return {
      ok: true,
      changed: false,
      property,
      fromStatus: property.status,
      toStatus: input.toStatus,
    };
  }

  const entries = applyStatusMoveToTimeline(property, input.toStatus);
  saveChecklistDone(property.id, []);

  const reason =
    (input.reason || "").trim() ||
    (decision.direction === "forward" ? "ผ่าน checklist ครบ" : "");
  appendStatusLog(property, property.status, input.toStatus, reason, input.changedBy || "ทีมงาน");

  const progress = analyzeTimeline(entries, input.toStatus).progress;
  const next = properties.map((p) =>
    p.id === property.id ? { ...p, status: input.toStatus, progress } : p
  );
  const created = saveProperties(next);
  const handover = created.find((item) => item.propertyId === property.id);

  const updated = next.find((p) => p.id === property.id) ?? property;
  return {
    ok: true,
    changed: true,
    property: updated,
    fromStatus: property.status,
    toStatus: input.toStatus,
    handover,
  };
}
