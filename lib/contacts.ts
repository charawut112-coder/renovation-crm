/** ประวัติการติดต่อของลูกค้า — mock ไม่ได้ส่งออกไปที่ LINE จริง */

export type ContactChannel = "LINE" | "โทร" | "นัดชม" | "Walk-in" | "โน้ต";

export interface ContactEvent {
  id: string;
  customerId: string;
  channel: ContactChannel;
  summary: string;
  propertyCode?: string;
  createdAt: string;
  by: string;
}

export const CONTACTS_KEY = "renovation-crm-contacts-v1";

export const CONTACT_CHANNELS: ContactChannel[] = ["LINE", "โทร", "นัดชม", "Walk-in", "โน้ต"];

const SEED_CONTACTS: ContactEvent[] = [
  {
    id: "ct-c1-1",
    customerId: "c1",
    channel: "LINE",
    summary: "ทักมาถามบ้านรามอินทรา งบ 4-5 ล้าน",
    propertyCode: "RN-2026-002",
    createdAt: "2026-09-02T04:10:00.000Z",
    by: "Lead Agent",
  },
  {
    id: "ct-c1-2",
    customerId: "c1",
    channel: "นัดชม",
    summary: "นัดชมบ้านแล้ว ชอบห้องน้ำที่รีโนเวท",
    propertyCode: "RN-2026-002",
    createdAt: "2026-09-18T02:30:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c1-3",
    customerId: "c1",
    channel: "โทร",
    summary: "โทรยืนยันว่ายังสนใจ รอตรวจงานก่อนนำขาย",
    propertyCode: "RN-2026-002",
    createdAt: "2026-10-20T03:00:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c2-1",
    customerId: "c2",
    channel: "LINE",
    summary: "ส่งมอบบ้านอารีย์ และแจ้งช่องทางแจ้งซ่อม",
    propertyCode: "RN-2026-006",
    createdAt: "2026-08-01T04:00:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c2-2",
    customerId: "c2",
    channel: "LINE",
    summary: "Follow-up +7 วัน ความพึงพอใจเบื้องต้นดีมาก",
    propertyCode: "RN-2026-006",
    createdAt: "2026-08-08T04:00:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c2-3",
    customerId: "c2",
    channel: "LINE",
    summary: "แจ้งน้ำหยดใต้ซิงก์ครัว เปิด Ticket แล้ว",
    propertyCode: "RN-2026-006",
    createdAt: "2026-08-15T06:20:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c2-4",
    customerId: "c2",
    channel: "LINE",
    summary: "ขอให้แนะนำเพื่อน: นภาพร วงศ์สุข",
    propertyCode: "RN-2026-006",
    createdAt: "2026-10-18T04:30:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c3-1",
    customerId: "c3",
    channel: "LINE",
    summary: "ถามความคืบหน้ารีโนเวทลาดพร้าว ซื้อเพื่อลงทุน",
    propertyCode: "RN-2026-001",
    createdAt: "2026-10-12T03:40:00.000Z",
    by: "ทีมงาน",
  },
  {
    id: "ct-c5-1",
    customerId: "c5",
    channel: "Walk-in",
    summary: "รับมอบบ้านสายไหมและเซ็นเอกสารโอน",
    propertyCode: "RN-2026-005",
    createdAt: "2026-10-01T02:00:00.000Z",
    by: "ทีมงาน",
  },
];

function clone(event: ContactEvent): ContactEvent {
  return { ...event };
}

export function loadContacts(): ContactEvent[] {
  if (typeof window === "undefined") return SEED_CONTACTS.map(clone);
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      const seed = SEED_CONTACTS.map(clone);
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as ContactEvent[];
    if (!Array.isArray(parsed)) return SEED_CONTACTS.map(clone);
    const ids = new Set(parsed.map((item) => item.id));
    const missing = SEED_CONTACTS.filter((item) => !ids.has(item.id)).map(clone);
    if (missing.length === 0) return parsed;
    const next = [...parsed, ...missing];
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return SEED_CONTACTS.map(clone);
  }
}

export function saveContacts(events: ContactEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(events));
}

export function contactsForCustomer(customerId: string): ContactEvent[] {
  return loadContacts()
    .filter((event) => event.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function latestContact(customerId: string): ContactEvent | undefined {
  return contactsForCustomer(customerId)[0];
}

export function appendContact(
  input: Omit<ContactEvent, "id" | "createdAt" | "by"> & { id?: string; createdAt?: string; by?: string }
): ContactEvent {
  const event: ContactEvent = {
    ...input,
    id: input.id || `ct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: input.createdAt || new Date().toISOString(),
    by: input.by || "ทีมงาน",
  };
  saveContacts([event, ...loadContacts()]);
  return event;
}
