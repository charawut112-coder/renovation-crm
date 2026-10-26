import type { Property, PropertyStatus } from "./data";

export const STATUS_CHECKLIST: Record<PropertyStatus, string[]> = {
  "บ้านเข้าใหม่": ["โฉนด", "รูปบ้านเดิม", "เอกสารสิทธิ์", "ต้นทุนซื้อ"],
  "นัดสำรวจ": ["รูปถ่ายละเอียด", "รายงานสภาพ", "จุดที่ต้องแก้"],
  "ออกแบบ": ["แบบ 2D/3D", "Mood board", "รายการวัสดุเบื้องต้น"],
  "อนุมัติแบบ": ["เซ็นอนุมัติ", "งบประมาณสุดท้าย", "Timeline"],
  "เตรียมงาน": ["ใบสั่งซื้อ", "สัญญาช่าง", "แผนงานรายสัปดาห์"],
  "เริ่มก่อสร้าง": ["รูป Progress รายสัปดาห์", "รายงานปัญหา"],
  "ตรวจงานก่อนนำขาย": ["Checklist QC", "รูปหลังทำ", "รายการแก้ไข"],
  "ส่งมอบให้ลูกค้า": ["สัญญาซื้อขาย", "เอกสารโอน", "รูปวันส่งมอบ"],
  "หลังการขาย": ["บันทึกรับประกัน", "Follow-up", "Ticket ซ่อม"],
};

export function canAdvance(property: Property & { checklistDone?: string[] }): {
  ok: boolean;
  missing: string[];
} {
  const required = STATUS_CHECKLIST[property.status] || [];
  const done = property.checklistDone || [];
  const missing = required.filter((item) => !done.includes(item));
  return { ok: missing.length === 0, missing };
}

export type StatusLog = {
  id: string;
  propertyId: string;
  propertyCode: string;
  fromStatus: PropertyStatus | null;
  toStatus: PropertyStatus;
  note?: string;
  changedBy: string;
  createdAt: string;
};

const LOG_KEY = "renovation-crm-status-logs-v2";

export function loadLogs(): StatusLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StatusLog[];
  } catch {
    return [];
  }
}

export function appendStatusLog(
  property: { id: string; code: string },
  fromStatus: PropertyStatus | null,
  toStatus: PropertyStatus,
  note?: string
) {
  const logs = loadLogs();
  const entry: StatusLog = {
    id: `log-${Date.now()}`,
    propertyId: property.id,
    propertyCode: property.code,
    fromStatus,
    toStatus,
    note,
    changedBy: "ทีมงาน",
    createdAt: new Date().toISOString(),
  };
  logs.unshift(entry);
  if (typeof window !== "undefined") {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)));
  }
  return entry;
}
