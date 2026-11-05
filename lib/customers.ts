/** ลูกค้า / ลีด — เก็บใน localStorage (mock ของ Customer entity) */

export type LeadScore = "Hot" | "Warm" | "Cold";

export interface Customer {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  source: string;
  leadScore: LeadScore;
  budget?: string;
  preferredLocation?: string;
  purpose?: string;
  timeline?: string;
  bedrooms?: string;
  interestedPropertyCode?: string;
  notes?: string;
  createdAt: string;
}

export const CUSTOMERS_KEY = "renovation-crm-customers-v1";

/** บ้านตัวอย่างที่ผูกกับลูกค้าอยู่แล้ว (รหัสบ้าน → ลูกค้า) — ชื่อตรงกับ customerName บน main */
export const PROPERTY_CUSTOMER_LINKS: Record<
  string,
  { customerId: string; customerName: string }
> = {
  "1": { customerId: "c3", customerName: "อนุชา รักบ้าน" },
  "2": { customerId: "c1", customerName: "สมชาย ใจดี" },
  "3": { customerId: "c4", customerName: "พิมพ์ใจ ดีมาก" },
  "4": { customerId: "c6", customerName: "ศิริพร แสงทอง" },
  "5": { customerId: "c5", customerName: "มานะ รุ่งเรือง" },
  "6": { customerId: "c2", customerName: "วิภา สุขใจ" },
  "7": { customerId: "c7", customerName: "ธนพล เจริญสุข" },
  "8": { customerId: "c8", customerName: "อรุณี มั่งมี" },
};

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    fullName: "สมชาย ใจดี",
    phone: "081-234-5678",
    email: "somchai@email.com",
    source: "LINE OA",
    leadScore: "Hot",
    budget: "4-5 ล้าน",
    preferredLocation: "บางนา, สุขุมวิท",
    purpose: "อยู่เอง",
    timeline: "ภายใน 30 วัน",
    interestedPropertyCode: "RN-2026-002",
    notes: "นัดชมบ้านแล้ว",
    createdAt: "2026-09-02T03:00:00.000Z",
  },
  {
    id: "c2",
    fullName: "วิภา สุขใจ",
    phone: "089-876-5432",
    source: "Facebook",
    leadScore: "Hot",
    budget: "5-6 ล้าน",
    preferredLocation: "พญาไท",
    purpose: "อยู่เอง",
    interestedPropertyCode: "RN-2026-006",
    notes: "รับมอบบ้านแล้ว · อยู่ระหว่างหลังการขาย",
    createdAt: "2026-07-18T03:00:00.000Z",
  },
  {
    id: "c3",
    fullName: "อนุชา รักบ้าน",
    phone: "062-111-2222",
    source: "LINE OA",
    leadScore: "Warm",
    budget: "3-4 ล้าน",
    preferredLocation: "จตุจักร, ลาดพร้าว",
    purpose: "ลงทุน",
    timeline: "2-3 เดือน",
    interestedPropertyCode: "RN-2026-001",
    notes: "สนใจลงทุน รอความคืบหน้ารีโนเวท",
    createdAt: "2026-09-20T03:00:00.000Z",
  },
  {
    id: "c4",
    fullName: "พิมพ์ใจ ดีมาก",
    phone: "095-333-4444",
    source: "Walk-in",
    leadScore: "Cold",
    preferredLocation: "บางบัวทอง",
    interestedPropertyCode: "RN-2026-003",
    notes: "สนใจบ้านบางบัวทอง",
    createdAt: "2026-10-01T03:00:00.000Z",
  },
  {
    id: "c5",
    fullName: "มานะ รุ่งเรือง",
    phone: "086-555-0199",
    email: "mana@email.com",
    source: "Facebook",
    leadScore: "Hot",
    budget: "3.5-4 ล้าน",
    preferredLocation: "สายไหม",
    purpose: "อยู่เอง",
    timeline: "ส่งมอบแล้ว",
    interestedPropertyCode: "RN-2026-005",
    notes: "ผู้รับมอบ RN-2026-005",
    createdAt: "2026-09-12T03:00:00.000Z",
  },
  {
    id: "c6",
    fullName: "ศิริพร แสงทอง",
    phone: "081-909-1004",
    source: "Walk-in",
    leadScore: "Warm",
    budget: "4 ล้าน",
    preferredLocation: "บางนา",
    purpose: "อยู่เอง",
    interestedPropertyCode: "RN-2026-004",
    notes: "บ้านเข้าใหม่ รอสำรวจ",
    createdAt: "2026-10-10T03:00:00.000Z",
  },
  {
    id: "c7",
    fullName: "ธนพล เจริญสุข",
    phone: "092-441-7707",
    source: "LINE OA",
    leadScore: "Warm",
    preferredLocation: "บางใหญ่",
    purpose: "อยู่เอง",
    interestedPropertyCode: "RN-2026-007",
    createdAt: "2026-10-05T03:00:00.000Z",
  },
  {
    id: "c8",
    fullName: "อรุณี มั่งมี",
    phone: "089-220-8808",
    source: "Facebook",
    leadScore: "Hot",
    budget: "5 ล้าน",
    preferredLocation: "ทองหล่อ",
    purpose: "อยู่เอง",
    interestedPropertyCode: "RN-2026-008",
    createdAt: "2026-10-08T03:00:00.000Z",
  },
];

function cloneCustomer(c: Customer): Customer {
  return { ...c };
}

export function loadCustomers(): Customer[] {
  if (typeof window === "undefined") return SEED_CUSTOMERS.map(cloneCustomer);
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      const seed = SEED_CUSTOMERS.map(cloneCustomer);
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Customer[];
    if (!Array.isArray(parsed)) return SEED_CUSTOMERS.map(cloneCustomer);
    const ids = new Set(parsed.map((c) => c.id));
    const missing = SEED_CUSTOMERS.filter((c) => !ids.has(c.id)).map(cloneCustomer);
    if (missing.length === 0) return parsed;
    const next = [...parsed, ...missing];
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return SEED_CUSTOMERS.map(cloneCustomer);
  }
}

export function saveCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getCustomer(id: string): Customer | undefined {
  return loadCustomers().find((c) => c.id === id);
}

export function addCustomer(
  input: Omit<Customer, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Customer {
  const customer: Customer = {
    ...input,
    id: input.id || `c-${Date.now()}`,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  const all = loadCustomers();
  saveCustomers([customer, ...all]);
  return customer;
}

export function updateCustomer(id: string, patch: Partial<Omit<Customer, "id" | "createdAt">>) {
  const next = loadCustomers().map((c) => (c.id === id ? { ...c, ...patch } : c));
  saveCustomers(next);
  return next.find((c) => c.id === id);
}

export function buildCustomerFromChat(
  answers: string[]
): Omit<Customer, "id" | "createdAt"> {
  const [name, budget, location, bedrooms, timeline, purpose, other, contact] = answers;
  const contactText = (contact || "").trim();
  const phone = /\d{2,}/.test(contactText) ? contactText : undefined;
  const noteLines = [
    other?.trim() ? `ดูบ้านอื่นอยู่: ${other.trim()}` : "",
    contactText ? `ช่องทางติดต่อกลับ: ${contactText}` : "",
    "บันทึกจาก Lead Agent (LINE)",
  ].filter(Boolean);
  return {
    fullName: (name || "").trim() || "ลูกค้าจาก LINE",
    phone,
    source: "LINE OA",
    leadScore: "Warm",
    budget: budget?.trim() || undefined,
    preferredLocation: location?.trim() || undefined,
    purpose: purpose?.trim() || undefined,
    timeline: timeline?.trim() || undefined,
    bedrooms: bedrooms?.trim() || undefined,
    notes: noteLines.join("\n"),
  };
}

export function matchPropertyCode(
  locationText: string,
  properties: { code: string; district: string; address: string }[]
): string | undefined {
  const text = locationText.trim();
  if (text.length < 2) return undefined;
  const tokens = text
    .split(/[,/|·\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const hit = properties.find(
    (p) =>
      text.includes(p.district) ||
      tokens.some((t) => p.district.includes(t) || p.address.includes(t))
  );
  return hit?.code;
}
