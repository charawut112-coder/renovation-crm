/** ตัวเลขและวันที่จากชีต Google (สตริงมีจุลภาค / วันแบบ dd/mm/yyyy) */

export function parseNum(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatQty(n: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
}

export function normKeyPart(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function houseKey(project: string, houseNo: string): string {
  return `${normKeyPart(project)}|${normKeyPart(houseNo)}`;
}

/** คืน ISO yyyy-mm-dd ถ้าอ่านได้ */
export function parseSheetDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isPastDate(iso: string, today = todayIso()): boolean {
  return Boolean(iso) && iso < today;
}

export function formatIsoDate(iso: string): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
}

export function driveFileUrl(raw: string): string | null {
  const m = String(raw || "").match(/DRIVEFILE:([A-Za-z0-9_-]+)/);
  if (!m) return null;
  return `https://drive.google.com/file/d/${m[1]}/view`;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
