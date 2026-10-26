import { createAfterSalesPackage } from "./aftersales";
import { PROPERTY_CUSTOMER_LINKS, loadCustomers, type Customer } from "./customers";

export type PropertyStatus =
  | "บ้านเข้าใหม่"
  | "นัดสำรวจ"
  | "ออกแบบ"
  | "อนุมัติแบบ"
  | "เตรียมงาน"
  | "เริ่มก่อสร้าง"
  | "ตรวจงานก่อนนำขาย"
  | "ส่งมอบให้ลูกค้า"
  | "หลังการขาย";

export const PIPELINE_STATUSES: PropertyStatus[] = [
  "บ้านเข้าใหม่",
  "นัดสำรวจ",
  "ออกแบบ",
  "อนุมัติแบบ",
  "เตรียมงาน",
  "เริ่มก่อสร้าง",
  "ตรวจงานก่อนนำขาย",
  "ส่งมอบให้ลูกค้า",
  "หลังการขาย",
];

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  "บ้านเข้าใหม่": "bg-slate-100 text-slate-700 border-slate-200",
  "นัดสำรวจ": "bg-blue-100 text-blue-700 border-blue-200",
  "ออกแบบ": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "อนุมัติแบบ": "bg-purple-100 text-purple-700 border-purple-200",
  "เตรียมงาน": "bg-amber-100 text-amber-700 border-amber-200",
  "เริ่มก่อสร้าง": "bg-orange-100 text-orange-700 border-orange-200",
  "ตรวจงานก่อนนำขาย": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "ส่งมอบให้ลูกค้า": "bg-green-100 text-green-700 border-green-200",
  "หลังการขาย": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export interface Property {
  id: string;
  code: string;
  address: string;
  district: string;
  /** ชื่อที่แสดง — ถ้ามี customerId ให้ใช้ resolveCustomerName */
  customerName: string;
  /** ผูกกับ Customer.id */
  customerId?: string;
  status: PropertyStatus;
  purchasePrice: number;
  salePrice?: number;
  progress: number;
  notes?: string;
}

const BASE_PROPERTIES: Property[] = [
  { id: "1", code: "RN-2026-001", address: "123 ซอยลาดพร้าว 15", district: "จตุจักร", customerName: "อนุชา รักบ้าน", customerId: "c3", status: "เริ่มก่อสร้าง", purchasePrice: 3200000, progress: 45, notes: "เปลี่ยนกระเบื้องห้องน้ำ" },
  { id: "2", code: "RN-2026-002", address: "45/8 ถนนรามอินทรา", district: "คันนายาว", customerName: "สมชาย ใจดี", customerId: "c1", status: "ตรวจงานก่อนนำขาย", purchasePrice: 2800000, salePrice: 4500000, progress: 95 },
  { id: "3", code: "RN-2026-003", address: "88 หมู่บ้านพฤกษา", district: "บางบัวทอง", customerName: "พิมพ์ใจ ดีมาก", customerId: "c4", status: "ออกแบบ", purchasePrice: 2100000, progress: 20 },
  { id: "4", code: "RN-2026-004", address: "12/3 ซอยสุขุมวิท 101", district: "บางนา", customerName: "ศิริพร แสงทอง", customerId: "c6", status: "บ้านเข้าใหม่", purchasePrice: 4100000, progress: 5 },
  { id: "5", code: "RN-2026-005", address: "56 ถนนพหลโยธิน", district: "สายไหม", customerName: "มานะ รุ่งเรือง", customerId: "c5", status: "ส่งมอบให้ลูกค้า", purchasePrice: 2500000, salePrice: 3900000, progress: 100 },
  { id: "6", code: "RN-2026-006", address: "9/2 ซอยอารีย์", district: "พญาไท", customerName: "วิภา สุขใจ", customerId: "c2", status: "หลังการขาย", purchasePrice: 3800000, salePrice: 5500000, progress: 100 },
  { id: "7", code: "RN-2026-007", address: "77 หมู่บ้านมัณฑนา", district: "บางใหญ่", customerName: "ธนพล เจริญสุข", customerId: "c7", status: "เตรียมงาน", purchasePrice: 2300000, progress: 30 },
  { id: "8", code: "RN-2026-008", address: "34 ซอยทองหล่อ 10", district: "คลองเตย", customerName: "อรุณี มั่งมี", customerId: "c8", status: "นัดสำรวจ", purchasePrice: 5200000, progress: 10 },
];

export const INITIAL_PROPERTIES: Property[] = BASE_PROPERTIES.map((p) => ({ ...p }));

export function formatPrice(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function progressFromStatus(status: PropertyStatus): number {
  const i = PIPELINE_STATUSES.indexOf(status);
  if (i < 0) return 0;
  return Math.round((i / (PIPELINE_STATUSES.length - 1)) * 100);
}

export const PROPERTIES_KEY = "renovation-crm-properties";

export function isHandoverStatus(status: PropertyStatus): boolean {
  return status === "ส่งมอบให้ลูกค้า" || status === "หลังการขาย";
}

/**
 * ชื่อที่แสดงของลูกค้าบ้านหลังนั้น
 * ลำดับ: เรคคอร์ดจาก customerId → customerName ที่เก็บไว้ → ชื่อในข้อมูลตั้งต้น → fallback
 */
export function resolveCustomerName(
  property: { id?: string; code?: string; customerId?: string; customerName?: string },
  customers?: Customer[],
  fallback = "ลูกค้าไม่ระบุชื่อ"
): string {
  const list = customers ?? loadCustomers();
  if (property.customerId) {
    const found = list.find((c) => c.id === property.customerId);
    if (found?.fullName?.trim()) return found.fullName.trim();
  }
  const direct = property.customerName?.trim();
  if (direct) return direct;
  const seed = INITIAL_PROPERTIES.find(
    (item) =>
      (property.id && item.id === property.id) || (property.code && item.code === property.code)
  );
  if (seed?.customerName.trim()) return seed.customerName.trim();
  return fallback;
}

function hydrateProperty(property: Property): Property {
  const link = PROPERTY_CUSTOMER_LINKS[property.id];
  const customerId = property.customerId || link?.customerId;
  const customerName = resolveCustomerName({
    id: property.id,
    code: property.code,
    customerId,
    customerName: property.customerName || link?.customerName,
  });
  return { ...property, customerId, customerName };
}

function readStoredProperties(): Property[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROPERTIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Property[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadProperties(): Property[] {
  const stored = readStoredProperties();
  const list = stored ?? INITIAL_PROPERTIES.map((p) => ({ ...p }));
  return list.map(hydrateProperty);
}

function serializeProperty(p: Property): Property {
  const stored: Property = {
    id: p.id,
    code: p.code,
    address: p.address,
    district: p.district,
    customerName: resolveCustomerName(p),
    status: p.status,
    purchasePrice: p.purchasePrice,
    progress: p.progress,
  };
  if (p.salePrice != null) stored.salePrice = p.salePrice;
  if (p.notes) stored.notes = p.notes;
  if (p.customerId) stored.customerId = p.customerId;
  return stored;
}

export type HandoverPackageCreated = {
  propertyId: string;
  propertyCode: string;
  customerName: string;
};

/**
 * บันทึกบ้าน แล้วถ้าสถานะเพิ่งเข้า «ส่งมอบให้ลูกค้า» หรือ «หลังการขาย»
 * จะสร้างแพ็กเกจหลังการขาย (idempotent ต่อ propertyId และเปลี่ยนชื่อเก่า «ลูกค้าผู้รับมอบ» ได้)
 * การเปลี่ยนสถานะต้องผ่าน changeStatus() — ฟังก์ชันนี้เป็นปลายทางบันทึก
 */
export function saveProperties(properties: Property[]): HandoverPackageCreated[] {
  if (typeof window === "undefined") return [];
  const previous = readStoredProperties() ?? INITIAL_PROPERTIES;
  const previousStatus = new Map(previous.map((property) => [property.id, property.status]));
  const clean = properties.map(serializeProperty);
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(clean));

  const created: HandoverPackageCreated[] = [];
  for (const property of clean) {
    if (!isHandoverStatus(property.status)) continue;
    const before = previousStatus.get(property.id);
    if (before === property.status) continue;
    const customerName = resolveCustomerName(property);
    const result = createAfterSalesPackage({
      propertyId: property.id,
      propertyCode: property.code,
      customerName,
    });
    if (result.created) {
      created.push({ propertyId: property.id, propertyCode: property.code, customerName });
    }
  }
  return created;
}

/** ผูกลูกค้าเข้ากับบ้าน ถ้าบ้านนั้นยังไม่มี customerId */
export function linkCustomerIfUnassigned(
  propertyCode: string,
  customer: { id: string; fullName: string }
): boolean {
  const properties = loadProperties();
  let linked = false;
  const next = properties.map((p) => {
    if (p.code !== propertyCode || p.customerId) return p;
    linked = true;
    return { ...p, customerId: customer.id, customerName: customer.fullName };
  });
  if (linked) saveProperties(next);
  return linked;
}
