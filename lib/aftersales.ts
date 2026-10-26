/** ระบบหลังการขาย ตามสเปก AI Agent CRM §6 */

export type WarrantyCategory =
  | "โครงสร้าง"
  | "สี"
  | "ไฟฟ้า"
  | "ประปา"
  | "งานไม้"
  | "อื่นๆ";

export type WarrantyStatus = "active" | "expired" | "claimed";

export interface Warranty {
  id: string;
  propertyId: string;
  propertyCode: string;
  customerName: string;
  category: WarrantyCategory;
  startDate: string;
  endDate: string;
  description: string;
  status: WarrantyStatus;
}

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "assigned" | "in_progress" | "done" | "closed";

export interface AfterSalesTicket {
  id: string;
  propertyId: string;
  propertyCode: string;
  customerName: string;
  customerPhone: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  underWarranty: boolean;
  warrantyCategory?: WarrantyCategory;
  assignedTo?: string;
  scheduledDate?: string;
  npsScore?: number;
  createdAt: string;
  completedAt?: string;
}

export type FollowupDay = 7 | 30 | 90 | 365;

export interface FollowupItem {
  id: string;
  propertyId: string;
  propertyCode: string;
  customerName: string;
  dayOffset: FollowupDay;
  dueDate: string;
  label: string;
  done: boolean;
  doneAt?: string;
}

export const WARRANTY_POLICY: {
  category: WarrantyCategory;
  years: number;
  description: string;
}[] = [
  { category: "โครงสร้าง", years: 5, description: "โครงสร้างหลัก" },
  { category: "สี", years: 2, description: "งานสี" },
  { category: "ไฟฟ้า", years: 1, description: "ระบบไฟฟ้า" },
  { category: "ประปา", years: 1, description: "ระบบประปา / สุขาภิบาล" },
  { category: "งานไม้", years: 1, description: "งานไม้ / บานประตูหน้าต่าง" },
];

export const FOLLOWUP_LABELS: Record<FollowupDay, string> = {
  7: "สอบถามความพึงพอใจเบื้องต้น (+7 วัน)",
  30: "ตรวจเช็คปัญหาที่อาจเกิดขึ้น (+30 วัน)",
  90: "Follow-up ทั่วไป + ขอ Review (+90 วัน)",
  365: "แจ้งเตือนรับประกันใกล้ครบปีแรก (+365 วัน)",
};

const W_KEY = "renovation-crm-warranties-v1";
const T_KEY = "renovation-crm-tickets-v1";
const F_KEY = "renovation-crm-followups-v1";

function addYears(isoDate: string, years: number): string {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function loadWarranties(): Warranty[] {
  if (typeof window === "undefined") return seedWarranties();
  try {
    const raw = localStorage.getItem(W_KEY);
    if (!raw) {
      const seed = seedWarranties();
      localStorage.setItem(W_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Warranty[];
  } catch {
    return seedWarranties();
  }
}

export function saveWarranties(items: Warranty[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(W_KEY, JSON.stringify(items));
}

export function loadTickets(): AfterSalesTicket[] {
  if (typeof window === "undefined") return seedTickets();
  try {
    const raw = localStorage.getItem(T_KEY);
    if (!raw) {
      const seed = seedTickets();
      localStorage.setItem(T_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as AfterSalesTicket[];
  } catch {
    return seedTickets();
  }
}

export function saveTickets(items: AfterSalesTicket[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(T_KEY, JSON.stringify(items));
}

export function loadFollowups(): FollowupItem[] {
  if (typeof window === "undefined") return seedFollowups();
  try {
    const raw = localStorage.getItem(F_KEY);
    if (!raw) {
      const seed = seedFollowups();
      localStorage.setItem(F_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as FollowupItem[];
  } catch {
    return seedFollowups();
  }
}

export function saveFollowups(items: FollowupItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(F_KEY, JSON.stringify(items));
}

export function createAfterSalesPackage(params: {
  propertyId: string;
  propertyCode: string;
  customerName: string;
  handoverDate?: string;
}) {
  const start = (params.handoverDate || new Date().toISOString()).slice(0, 10);
  const warranties = loadWarranties();
  const followups = loadFollowups();
  if (warranties.some((w) => w.propertyId === params.propertyId)) {
    return { created: false };
  }
  const newWarranties: Warranty[] = WARRANTY_POLICY.map((p, i) => ({
    id: `w-${params.propertyId}-${i}`,
    propertyId: params.propertyId,
    propertyCode: params.propertyCode,
    customerName: params.customerName,
    category: p.category,
    startDate: start,
    endDate: addYears(start, p.years),
    description: p.description,
    status: "active" as WarrantyStatus,
  }));
  const days: FollowupDay[] = [7, 30, 90, 365];
  const newFollowups: FollowupItem[] = days.map((d) => ({
    id: `f-${params.propertyId}-${d}`,
    propertyId: params.propertyId,
    propertyCode: params.propertyCode,
    customerName: params.customerName,
    dayOffset: d,
    dueDate: addDays(start, d),
    label: FOLLOWUP_LABELS[d],
    done: false,
  }));
  saveWarranties([...newWarranties, ...warranties]);
  saveFollowups([...newFollowups, ...followups]);
  return { created: true, warranties: newWarranties, followups: newFollowups };
}

export function warrantyExpiringSoon(w: Warranty, withinDays = 30): boolean {
  if (w.status !== "active") return false;
  const end = new Date(w.endDate).getTime();
  const now = Date.now();
  const limit = withinDays * 24 * 60 * 60 * 1000;
  return end >= now && end - now <= limit;
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
}

function seedWarranties(): Warranty[] {
  const start = "2026-08-01";
  return WARRANTY_POLICY.map((p, i) => ({
    id: `w-6-${i}`,
    propertyId: "6",
    propertyCode: "RN-2026-006",
    customerName: "วิภา สุขใจ",
    category: p.category,
    startDate: start,
    endDate: addYears(start, p.years),
    description: p.description,
    status: "active" as WarrantyStatus,
  }));
}

function seedTickets(): AfterSalesTicket[] {
  return [
    {
      id: "t1",
      propertyId: "6",
      propertyCode: "RN-2026-006",
      customerName: "วิภา สุขใจ",
      customerPhone: "089-876-5432",
      title: "น้ำหยดที่ใต้ซิงก์ครัว",
      description: "พบน้ำหยดเล็กน้อยบริเวณท่อใต้ซิงก์ หลังใช้งาน 2 สัปดาห์",
      priority: "medium",
      status: "open",
      underWarranty: true,
      warrantyCategory: "ประปา",
      createdAt: new Date().toISOString(),
    },
  ];
}

function seedFollowups(): FollowupItem[] {
  const start = "2026-08-01";
  const days: FollowupDay[] = [7, 30, 90, 365];
  return days.map((d) => ({
    id: `f-6-${d}`,
    propertyId: "6",
    propertyCode: "RN-2026-006",
    customerName: "วิภา สุขใจ",
    dayOffset: d,
    dueDate: addDays(start, d),
    label: FOLLOWUP_LABELS[d],
    done: d === 7 || d === 30,
    doneAt: d === 7 || d === 30 ? addDays(start, d) : undefined,
  }));
}

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "เร่งด่วน",
  high: "สูง",
  medium: "ปานกลาง",
  low: "ต่ำ",
};

export const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "เปิด",
  assigned: "มอบหมายแล้ว",
  in_progress: "กำลังซ่อม",
  done: "เสร็จแล้ว",
  closed: "ปิดงาน",
};
