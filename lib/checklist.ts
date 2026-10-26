import type { Property, PropertyStatus } from "./data";
import { PIPELINE_STATUSES, loadProperties } from "./data";
import {
  checklistItemRequiresMedia,
  loadMedia,
  mediaForChecklistItem,
  type MediaFile,
} from "./media";
import { loadTimelines } from "./timeline";

export const CHECK_KEY = "renovation-crm-checklist-v1";
export const LOG_KEY = "renovation-crm-status-logs-v2";

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

export function loadChecklistMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(CHECK_KEY) || "{}") as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChecklistMap(map: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECK_KEY, JSON.stringify(map));
}

export function loadChecklistDone(propertyId: string): string[] {
  return loadChecklistMap()[propertyId] || [];
}

export function saveChecklistDone(propertyId: string, items: string[]) {
  const map = loadChecklistMap();
  map[propertyId] = items;
  saveChecklistMap(map);
}

export function toggleChecklistItem(propertyId: string, item: string): string[] {
  const done = loadChecklistDone(propertyId);
  const next = done.includes(item) ? done.filter((x) => x !== item) : [...done, item];
  saveChecklistDone(propertyId, next);
  return next;
}

export function isChecklistItemSatisfied(
  propertyId: string,
  item: string,
  done: string[],
  files?: MediaFile[]
): boolean {
  if (checklistItemRequiresMedia(item)) {
    const list = files ?? loadMedia();
    return mediaForChecklistItem(propertyId, item, list).length > 0;
  }
  return done.includes(item);
}

export function canAdvance(property: Property & { checklistDone?: string[] }): {
  ok: boolean;
  missing: string[];
  missingLabels: string[];
} {
  const required = STATUS_CHECKLIST[property.status] || [];
  const done = property.checklistDone || [];
  const files = loadMedia().filter((f) => f.propertyId === property.id);
  const missing = required.filter((item) => !isChecklistItemSatisfied(property.id, item, done, files));
  const missingLabels = missing.map((item) =>
    checklistItemRequiresMedia(item) ? `${item} (ต้องแนบไฟล์)` : item
  );
  return { ok: missing.length === 0, missing, missingLabels };
}

export type StatusLog = {
  id: string;
  propertyId: string;
  propertyCode: string;
  fromStatus: PropertyStatus | null;
  toStatus: PropertyStatus;
  note?: string;
  reason?: string;
  changedBy: string;
  createdAt: string;
};

function buildSeedLogs(): StatusLog[] {
  const properties = loadProperties();
  const timelines = loadTimelines(properties);
  const logs: StatusLog[] = [];
  for (const property of properties) {
    const idx = Math.max(0, PIPELINE_STATUSES.indexOf(property.status));
    const entries = timelines[property.id] || [];
    if (idx === 0) {
      const when = entries[0]?.plannedDate;
      logs.push({
        id: `seed-${property.id}-enter`,
        propertyId: property.id,
        propertyCode: property.code,
        fromStatus: null,
        toStatus: property.status,
        note: "รับบ้านเข้าใหม่",
        reason: "รับบ้านเข้าใหม่",
        changedBy: "ทีมงาน",
        createdAt: when ? `${when}T02:00:00.000Z` : new Date().toISOString(),
      });
      continue;
    }
    for (let i = 0; i < idx; i++) {
      const when = entries[i]?.actualDate || entries[i]?.plannedDate;
      logs.push({
        id: `seed-${property.id}-${i + 1}`,
        propertyId: property.id,
        propertyCode: property.code,
        fromStatus: PIPELINE_STATUSES[i],
        toStatus: PIPELINE_STATUSES[i + 1],
        note: "ข้อมูลเริ่มต้น",
        reason: "ข้อมูลเริ่มต้น",
        changedBy: "ทีมงาน",
        createdAt: when ? `${when}T02:00:00.000Z` : new Date().toISOString(),
      });
    }
  }
  logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return logs;
}

export function loadLogs(): StatusLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StatusLog[];
      return Array.isArray(parsed) ? parsed : [];
    }
    const seeded = buildSeedLogs();
    localStorage.setItem(LOG_KEY, JSON.stringify(seeded.slice(0, 200)));
    return seeded;
  } catch {
    return [];
  }
}

export function appendStatusLog(
  property: { id: string; code: string },
  fromStatus: PropertyStatus | null,
  toStatus: PropertyStatus,
  note?: string,
  changedBy = "ทีมงาน"
) {
  const logs = loadLogs();
  const entry: StatusLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    propertyId: property.id,
    propertyCode: property.code,
    fromStatus,
    toStatus,
    note,
    reason: note,
    changedBy,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(entry);
  if (typeof window !== "undefined") {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)));
  }
  return entry;
}
