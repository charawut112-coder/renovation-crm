import {
  PIPELINE_STATUSES,
  loadProperties,
  saveProperties,
  type Property,
  type PropertyStatus,
} from "./data";

export const TIMELINE_KEY = "renovation-crm-timeline-v1";

export interface StatusTimelineEntry {
  status: PropertyStatus;
  /** วันเป้าหมายที่ควรจบขั้นนี้ (YYYY-MM-DD) */
  plannedDate: string;
  /** วันที่จบขั้นจริง — ว่างถ้ายังไม่เสร็จ */
  actualDate?: string;
}

export type TimelineMap = Record<string, StatusTimelineEntry[]>;

/** ความยาวแผนของแต่ละขั้น (วัน) ใช้ตอน seed วันแผนสะสม */
const STAGE_DURATION_DAYS = [5, 7, 14, 7, 10, 35, 7, 14, 30];

type SeedProfile = {
  /** วันแผนของสถานะปัจจุบัน เทียบวันนี้ (ติดลบ = เลยกำหนด) */
  currentPlannedOffset: number;
  /** วันที่จริงของขั้นที่จบแล้ว = วันแผน + slip */
  slip: number;
};

const SEED_PROFILE: Record<string, SeedProfile> = {
  "1": { currentPlannedOffset: -12, slip: 4 },
  "2": { currentPlannedOffset: -8, slip: 0 },
  "3": { currentPlannedOffset: 9, slip: 0 },
  "4": { currentPlannedOffset: 4, slip: 0 },
  "5": { currentPlannedOffset: 2, slip: 0 },
  "6": { currentPlannedOffset: -18, slip: 0 },
  "7": { currentPlannedOffset: -3, slip: 0 },
  "8": { currentPlannedOffset: 5, slip: 0 },
};

export function todayISO(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(later: string, earlier: string): number {
  const a = Date.parse(`${later.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${earlier.slice(0, 10)}T00:00:00Z`);
  return Math.round((a - b) / 86400000);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const day = iso.slice(0, 10);
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type StagePhase = "past" | "current" | "upcoming";

export type StageView = {
  status: PropertyStatus;
  plannedDate: string;
  actualDate?: string;
  done: boolean;
  late: boolean;
  lateDays: number;
  earlyDays: number;
  phase: StagePhase;
};

export type TimelineAnalysis = {
  stages: StageView[];
  doneCount: number;
  total: number;
  progress: number;
  expectedCount: number;
  expectedProgress: number;
  late: boolean;
  lateCount: number;
};

/**
 * ความคืบหน้า = ขั้นที่มีวันที่จริง / 9
 * ตามแผน = ขั้นที่วันแผนผ่านมาแล้ว (ก่อนวันนี้)
 * ล่าช้าเมื่อวันจริงเกินแผน หรือยังไม่มีวันจริงทั้งที่แผนผ่านมาแล้ว
 */
export function analyzeTimeline(
  entries: StatusTimelineEntry[],
  currentStatus: PropertyStatus,
  today = todayISO()
): TimelineAnalysis {
  const currentIdx = Math.max(0, PIPELINE_STATUSES.indexOf(currentStatus));
  const stages: StageView[] = PIPELINE_STATUSES.map((status, index) => {
    const found = entries.find((e) => e.status === status);
    const plannedDate = found?.plannedDate || today;
    const actualDate = found?.actualDate;
    const done = Boolean(actualDate);
    const lateByActual = Boolean(done && actualDate && actualDate > plannedDate);
    // ขั้นที่เลยมาแล้วหรือขั้นปัจจุบันที่แผนผ่านมาแล้ว โดยยังไม่มีวันจริง
    const overdue = !done && plannedDate < today && index <= currentIdx;
    const late = lateByActual || overdue;
    const lateDays = lateByActual
      ? diffDays(actualDate!, plannedDate)
      : overdue
        ? diffDays(today, plannedDate)
        : 0;
    const earlyDays = done && actualDate && actualDate < plannedDate ? diffDays(plannedDate, actualDate) : 0;
    const phase: StagePhase = index < currentIdx ? "past" : index === currentIdx ? "current" : "upcoming";
    return { status, plannedDate, actualDate, done, late, lateDays, earlyDays, phase };
  });
  const doneCount = stages.filter((s) => s.done).length;
  const total = stages.length || 1;
  const expectedCount = stages.filter((s) => s.plannedDate < today).length;
  const progress = Math.round((doneCount / total) * 100);
  const expectedProgress = Math.round((expectedCount / total) * 100);
  const late = stages.some((s) => s.late) || doneCount < expectedCount;
  return {
    stages,
    doneCount,
    total: stages.length,
    progress,
    expectedCount,
    expectedProgress,
    late,
    lateCount: stages.filter((s) => s.late).length,
  };
}

export function stageTimingLabel(stage: StageView): string {
  if (stage.done && stage.late) return `ล่าช้า ${stage.lateDays} วัน`;
  if (stage.done && stage.earlyDays > 0) return `ก่อนแผน ${stage.earlyDays} วัน`;
  if (stage.done) return "ตรงเวลา";
  if (stage.late) return `เลยแผน ${stage.lateDays} วัน`;
  if (stage.phase === "upcoming" && stage.plannedDate < todayISO()) return "แผนเลยกำหนด";
  if (stage.phase === "current") return "กำลังทำ";
  return "ยังไม่ถึง";
}

export function seedTimelineForProperty(
  property: Pick<Property, "id" | "status">,
  today = todayISO()
): StatusTimelineEntry[] {
  const idx = Math.max(0, PIPELINE_STATUSES.indexOf(property.status));
  const profile = SEED_PROFILE[property.id] ?? { currentPlannedOffset: 7, slip: 0 };
  const planned: string[] = new Array(PIPELINE_STATUSES.length);
  planned[idx] = addDays(today, profile.currentPlannedOffset);
  for (let i = idx - 1; i >= 0; i--) {
    planned[i] = addDays(planned[i + 1], -STAGE_DURATION_DAYS[i + 1]);
  }
  for (let i = idx + 1; i < planned.length; i++) {
    planned[i] = addDays(planned[i - 1], STAGE_DURATION_DAYS[i]);
  }
  const lastDone = property.status === "หลังการขาย" ? idx : idx - 1;
  return PIPELINE_STATUSES.map((status, i) => {
    const entry: StatusTimelineEntry = { status, plannedDate: planned[i] };
    if (i <= lastDone) entry.actualDate = addDays(planned[i], profile.slip);
    return entry;
  });
}

function readMap(): TimelineMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TIMELINE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TimelineMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: TimelineMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(map));
}

export function loadTimelines(
  properties?: Pick<Property, "id" | "status">[]
): TimelineMap {
  const props = properties ?? loadProperties();
  const map = readMap();
  let changed = false;
  for (const p of props) {
    if (!map[p.id] || map[p.id].length === 0) {
      map[p.id] = seedTimelineForProperty(p);
      changed = true;
    }
  }
  if (changed) writeMap(map);
  return map;
}

export function getPropertyTimeline(property: Pick<Property, "id" | "status">): StatusTimelineEntry[] {
  const map = loadTimelines([property]);
  return (map[property.id] || seedTimelineForProperty(property)).map((e) => ({ ...e }));
}

export function savePropertyTimeline(propertyId: string, entries: StatusTimelineEntry[]) {
  const map = readMap();
  map[propertyId] = entries;
  writeMap(map);
}

/** อัปเดตวันแผน/วันจริง แล้วบันทึก progress ของบ้านให้ตรงกับ timeline */
export function updateStageDate(
  propertyId: string,
  status: PropertyStatus,
  patch: { plannedDate?: string; actualDate?: string | null }
): StatusTimelineEntry[] | null {
  const properties = loadProperties();
  const property = properties.find((p) => p.id === propertyId);
  if (!property) return null;
  const entries = getPropertyTimeline(property);
  const entry = entries.find((e) => e.status === status);
  if (!entry) return null;
  if (patch.plannedDate) entry.plannedDate = patch.plannedDate;
  if (patch.actualDate === null) delete entry.actualDate;
  else if (patch.actualDate) entry.actualDate = patch.actualDate;
  savePropertyTimeline(propertyId, entries);
  const progress = analyzeTimeline(entries, property.status).progress;
  saveProperties(properties.map((p) => (p.id === propertyId ? { ...p, progress } : p)));
  return entries;
}

/**
 * เลื่อนสถานะแล้วปรับวันจริง:
 * - ไปข้างหน้า: ใส่ actual ของขั้นที่กำลังจะออก ถ้ายังไม่มี
 * - ย้อนกลับ: ล้าง actual ตั้งแต่ขั้นปลายทางเป็นต้นไป
 */
export function applyStatusMoveToTimeline(property: Property, toStatus: PropertyStatus): StatusTimelineEntry[] {
  const fromIdx = PIPELINE_STATUSES.indexOf(property.status);
  const toIdx = PIPELINE_STATUSES.indexOf(toStatus);
  const entries = getPropertyTimeline(property);
  if (toIdx > fromIdx) {
    const leaving = entries.find((e) => e.status === property.status);
    if (leaving && !leaving.actualDate) leaving.actualDate = todayISO();
  } else if (toIdx < fromIdx) {
    for (const entry of entries) {
      if (PIPELINE_STATUSES.indexOf(entry.status) >= toIdx) delete entry.actualDate;
    }
  }
  savePropertyTimeline(property.id, entries);
  return entries;
}
