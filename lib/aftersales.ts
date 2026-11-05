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
  customerId?: string;
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
  customerId?: string;
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
  customerId?: string;
  dayOffset: FollowupDay;
  dueDate: string;
  label: string;
  done: boolean;
  doneAt?: string;
  /** ข้อความที่บันทึกเป็น LINE จำลอง */
  lineMessage?: string;
  sentVia?: "LINE";
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

const LEGACY_HANDOVER_NAME = "ลูกค้าผู้รับมอบ";

function replaceLegacyCustomerName<T extends { propertyId: string; customerName: string }>(
  items: T[],
  propertyId: string,
  customerName: string
): { items: T[]; changed: boolean } {
  const nextName = customerName.trim();
  if (!nextName || nextName === LEGACY_HANDOVER_NAME) {
    return { items, changed: false };
  }
  let changed = false;
  const next = items.map((item) => {
    if (item.propertyId !== propertyId) return item;
    if (item.customerName.trim() !== LEGACY_HANDOVER_NAME) return item;
    changed = true;
    return { ...item, customerName: nextName };
  });
  return { items: next, changed };
}

function stampCustomerId<T extends { propertyId: string; customerId?: string }>(
  items: T[],
  propertyId: string,
  customerId?: string
): { items: T[]; changed: boolean } {
  if (!customerId) return { items, changed: false };
  let changed = false;
  const next = items.map((item) => {
    if (item.propertyId !== propertyId || item.customerId) return item;
    changed = true;
    return { ...item, customerId };
  });
  return { items: next, changed };
}

export function createAfterSalesPackage(params: {
  propertyId: string;
  propertyCode: string;
  customerName: string;
  customerId?: string;
  handoverDate?: string;
}) {
  const start = (params.handoverDate || new Date().toISOString()).slice(0, 10);
  const warranties = loadWarranties();
  const followups = loadFollowups();
  if (warranties.some((w) => w.propertyId === params.propertyId)) {
    const nextWarranties = replaceLegacyCustomerName(warranties, params.propertyId, params.customerName);
    const nextFollowups = replaceLegacyCustomerName(followups, params.propertyId, params.customerName);
    const withIdW = stampCustomerId(nextWarranties.items, params.propertyId, params.customerId);
    const withIdF = stampCustomerId(nextFollowups.items, params.propertyId, params.customerId);
    if (nextWarranties.changed || withIdW.changed) saveWarranties(withIdW.items);
    if (nextFollowups.changed || withIdF.changed) saveFollowups(withIdF.items);
    return {
      created: false as const,
      renamed: nextWarranties.changed || nextFollowups.changed || withIdW.changed || withIdF.changed,
    };
  }
  const newWarranties: Warranty[] = WARRANTY_POLICY.map((p, i) => ({
    id: `w-${params.propertyId}-${i}`,
    propertyId: params.propertyId,
    propertyCode: params.propertyCode,
    customerName: params.customerName,
    customerId: params.customerId,
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
    customerId: params.customerId,
    dayOffset: d,
    dueDate: addDays(start, d),
    label: FOLLOWUP_LABELS[d],
    done: false,
  }));
  saveWarranties([...newWarranties, ...warranties]);
  saveFollowups([...newFollowups, ...followups]);
  return { created: true as const, renamed: false, warranties: newWarranties, followups: newFollowups };
}

export function followupLineMessage(
  item: Pick<FollowupItem, "customerName" | "propertyCode" | "dayOffset">,
  address?: string
): string {
  const place = address ? `${item.propertyCode} (${address})` : item.propertyCode;
  const name = item.customerName;
  switch (item.dayOffset) {
    case 7:
      return `สวัสดีค่ะคุณ${name}\nบ้าน ${place} ส่งมอบไปได้ 7 วันแล้ว\nขออนุญาตสอบถามความพึงพอใจเบื้องต้นนะคะ มีจุดไหนที่อยากให้ทีมดูแลเพิ่มเติมไหมคะ`;
    case 30:
      return `สวัสดีค่ะคุณ${name}\nครบ 30 วันหลังส่งมอบบ้าน ${place}\nขอเช็คว่ามีปัญหาการใช้งานหรือจุดที่ต้องแก้ไขหรือไม่ค่ะ แจ้งได้เลยนะคะ`;
    case 90:
      return `สวัสดีค่ะคุณ${name}\nครบ 90 วันแล้วสำหรับบ้าน ${place}\nรบกวนขอรีวิวสั้น ๆ และถ้ามีเพื่อนที่กำลังมองบ้านรีโนเวท ช่วยแนะนำเราได้ค่ะ`;
    case 365:
      return `สวัสดีค่ะคุณ${name}\nรับประกันปีแรกของบ้าน ${place} ใกล้ครบกำหนด\nงานสี ไฟฟ้า ประปา และงานไม้ครบ 1 ปี — โครงสร้างยังคุ้มครองต่อถึง 5 ปี\nหากต้องการให้ทีมตรวจเช็คก่อนหมดประกันปีแรก ตอบกลับข้อความนี้ได้เลยค่ะ`;
  }
}

export function completeFollowup(id: string, lineMessage: string): FollowupItem | null {
  const message = lineMessage.trim();
  if (!message) return null;
  const items = loadFollowups();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated: FollowupItem = {
    ...items[index],
    done: true,
    doneAt: new Date().toISOString().slice(0, 10),
    lineMessage: message,
    sentVia: "LINE",
  };
  const next = items.slice();
  next[index] = updated;
  saveFollowups(next);
  return updated;
}

export function claimWarranty(propertyId: string, category: WarrantyCategory): boolean {
  let claimed = false;
  const next = loadWarranties().map((item) => {
    if (item.propertyId !== propertyId || item.category !== category || item.status !== "active") return item;
    claimed = true;
    return { ...item, status: "claimed" as const };
  });
  if (claimed) saveWarranties(next);
  return claimed;
}

export function warrantyDatePassed(warranty: Warranty, now = new Date()): boolean {
  return new Date(warranty.endDate).setHours(0, 0, 0, 0) < new Date(now).setHours(0, 0, 0, 0);
}

export function findActiveWarranty(propertyId: string, category: WarrantyCategory): Warranty | undefined {
  return loadWarranties().find(
    (item) =>
      item.propertyId === propertyId &&
      item.category === category &&
      item.status === "active" &&
      !warrantyDatePassed(item)
  );
}

export function propertyHasWarranty(propertyId: string): boolean {
  return loadWarranties().some((item) => item.propertyId === propertyId);
}

export function propertyHasFollowup(propertyId: string): boolean {
  return loadFollowups().some((item) => item.propertyId === propertyId);
}

export function propertyHasTicket(propertyId: string): boolean {
  return loadTickets().some((item) => item.propertyId === propertyId);
}

export type ScheduleKind = "followup" | "ticket";

export interface ScheduleEntry {
  id: string;
  date: string;
  kind: ScheduleKind;
  title: string;
  propertyCode: string;
  customerName: string;
  overdue: boolean;
  done: boolean;
}

export function loadSchedule(): ScheduleEntry[] {
  const followups: ScheduleEntry[] = loadFollowups().map((item) => ({
    id: item.id,
    date: item.dueDate,
    kind: "followup",
    title: item.label,
    propertyCode: item.propertyCode,
    customerName: item.customerName,
    overdue: !item.done && isOverdue(item.dueDate),
    done: item.done,
  }));
  const tickets: ScheduleEntry[] = loadTickets()
    .filter((item) => item.scheduledDate)
    .map((item) => ({
      id: item.id,
      date: item.scheduledDate as string,
      kind: "ticket" as const,
      title: `${item.title} · ${TICKET_STATUS_LABEL[item.status]}`,
      propertyCode: item.propertyCode,
      customerName: item.customerName,
      overdue: !["done", "closed"].includes(item.status) && isOverdue(item.scheduledDate as string),
      done: item.status === "done" || item.status === "closed",
    }));
  return [...followups, ...tickets].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "th")
  );
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
    customerId: "c2",
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
      customerId: "c2",
      customerPhone: "089-876-5432",
      title: "น้ำหยดที่ใต้ซิงก์ครัว",
      description: "พบน้ำหยดเล็กน้อยบริเวณท่อใต้ซิงก์ หลังใช้งาน 2 สัปดาห์",
      priority: "medium",
      status: "assigned",
      underWarranty: true,
      warrantyCategory: "ประปา",
      assignedTo: "ช่างประปา",
      scheduledDate: addDays(new Date().toISOString().slice(0, 10), 2),
      createdAt: "2026-08-15T06:20:00.000Z",
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
    customerId: "c2",
    dayOffset: d,
    dueDate: addDays(start, d),
    label: FOLLOWUP_LABELS[d],
    done: d === 7 || d === 30,
    doneAt: d === 7 || d === 30 ? addDays(start, d) : undefined,
    sentVia: d === 7 || d === 30 ? ("LINE" as const) : undefined,
    lineMessage:
      d === 7 || d === 30
        ? followupLineMessage({ customerName: "วิภา สุขใจ", propertyCode: "RN-2026-006", dayOffset: d })
        : undefined,
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

export const WARRANTY_STATUS_LABEL: Record<WarrantyStatus, string> = {
  active: "คุ้มครอง",
  expired: "หมดอายุ",
  claimed: "เคลมแล้ว",
};

export const TICKET_ASSIGNEES = ["ช่างประปา", "ช่างไฟฟ้า", "ช่างสี", "ช่างไม้", "หัวหน้าช่าง"];
