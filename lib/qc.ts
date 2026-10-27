/** ตรวจงานก่อนนำขาย — รายการ QC ตามหมวดรับประกัน */

export const QC_KEY = "renovation-crm-qc-v1";

export const QC_ITEMS: { id: string; label: string; category: string }[] = [
  { id: "structure", label: "โครงสร้าง ผนัง และพื้น", category: "โครงสร้าง" },
  { id: "paint", label: "งานสี", category: "สี" },
  { id: "electric", label: "ระบบไฟฟ้า", category: "ไฟฟ้า" },
  { id: "plumbing", label: "ประปาและสุขาภิบาล", category: "ประปา" },
  { id: "wood", label: "งานไม้และบานประตูหน้าต่าง", category: "งานไม้" },
  { id: "finish", label: "ความสะอาดและพร้อมขาย", category: "อื่นๆ" },
];

export type QcMap = Record<string, Record<string, boolean>>;

function allPassed(): Record<string, boolean> {
  return Object.fromEntries(QC_ITEMS.map((item) => [item.id, true]));
}

function seedQc(): QcMap {
  const partial = Object.fromEntries(QC_ITEMS.map((item, index) => [item.id, index < 3]));
  return {
    "2": partial,
    "5": allPassed(),
    "6": allPassed(),
  };
}

export function loadQcMap(): QcMap {
  if (typeof window === "undefined") return seedQc();
  try {
    const raw = localStorage.getItem(QC_KEY);
    if (!raw) {
      const seed = seedQc();
      localStorage.setItem(QC_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as QcMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadQc(propertyId: string): Record<string, boolean> {
  return { ...(loadQcMap()[propertyId] || {}) };
}

export function saveQcItem(propertyId: string, itemId: string, passed: boolean) {
  if (typeof window === "undefined") return;
  const map = loadQcMap();
  map[propertyId] = { ...(map[propertyId] || {}), [itemId]: passed };
  localStorage.setItem(QC_KEY, JSON.stringify(map));
}

export function isQcComplete(propertyId: string): boolean {
  const current = loadQc(propertyId);
  return QC_ITEMS.every((item) => current[item.id] === true);
}

export function qcProgress(propertyId: string): { done: number; total: number } {
  const current = loadQc(propertyId);
  return {
    done: QC_ITEMS.filter((item) => current[item.id]).length,
    total: QC_ITEMS.length,
  };
}
