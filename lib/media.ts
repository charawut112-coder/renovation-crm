import type { PropertyStatus } from "./data";

/** ชนิดไฟล์ตามสเปก media_files.kind */
export type MediaKind = "before" | "during" | "after" | "design" | "doc";

/**
 * ไฟล์แนบของบ้าน / รายการ checklist (mock — เก็บ data URL ใน localStorage)
 * checklistItemId และ checklistItemKey ใช้ข้อความรายการ checklist เป็นคีย์เดียวกัน
 */
export interface MediaFile {
  id: string;
  propertyId: string;
  status?: PropertyStatus;
  checklistItemId: string;
  checklistItemKey: string;
  kind: MediaKind;
  name: string;
  mime: string;
  createdAt: string;
  dataUrl: string;
}

export const MEDIA_KEY = "renovation-crm-media-v1";

/** รายการ checklist ที่ต้องมีไฟล์แนบ จึงจะนับว่าเสร็จ (ติ๊กอย่างเดียวไม่พอ) */
export const CHECKLIST_MEDIA_KIND: Record<string, MediaKind> = {
  โฉนด: "doc",
  รูปบ้านเดิม: "before",
  เอกสารสิทธิ์: "doc",
  รูปถ่ายละเอียด: "before",
  "แบบ 2D/3D": "design",
  "Mood board": "design",
  ใบสั่งซื้อ: "doc",
  สัญญาช่าง: "doc",
  "รูป Progress รายสัปดาห์": "during",
  รูปหลังทำ: "after",
  สัญญาซื้อขาย: "doc",
  เอกสารโอน: "doc",
  รูปวันส่งมอบ: "after",
};

export function checklistItemRequiresMedia(item: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHECKLIST_MEDIA_KIND, item);
}

export function mediaKindForChecklistItem(item: string): MediaKind {
  return CHECKLIST_MEDIA_KIND[item] ?? "doc";
}

export function loadMedia(): MediaFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MEDIA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MediaFile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMedia(files: MediaFile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEDIA_KEY, JSON.stringify(files));
}

export function mediaForProperty(propertyId: string, files = loadMedia()): MediaFile[] {
  return files.filter((f) => f.propertyId === propertyId);
}

export function mediaForChecklistItem(
  propertyId: string,
  item: string,
  files = loadMedia()
): MediaFile[] {
  return files.filter(
    (f) =>
      f.propertyId === propertyId &&
      (f.checklistItemKey === item || f.checklistItemId === item)
  );
}

export function addMedia(
  input: Omit<MediaFile, "id" | "createdAt" | "checklistItemId"> & {
    id?: string;
    checklistItemId?: string;
  }
): MediaFile {
  const itemKey = input.checklistItemKey;
  const file: MediaFile = {
    ...input,
    id: input.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    checklistItemId: input.checklistItemId || itemKey,
    checklistItemKey: itemKey,
    createdAt: new Date().toISOString(),
  };
  const all = loadMedia();
  saveMedia([file, ...all]);
  return file;
}

export function removeMedia(id: string) {
  saveMedia(loadMedia().filter((f) => f.id !== id));
}
