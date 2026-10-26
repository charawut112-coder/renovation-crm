import { createAfterSalesPackage } from "./aftersales";

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
  customerName: string;
  status: PropertyStatus;
  purchasePrice: number;
  salePrice?: number;
  progress: number;
  notes?: string;
}

export const INITIAL_PROPERTIES: Property[] = [
  { id: "1", code: "RN-2026-001", address: "123 ซอยลาดพร้าว 15", district: "จตุจักร", customerName: "อนุชา รักบ้าน", status: "เริ่มก่อสร้าง", purchasePrice: 3200000, progress: 45, notes: "เปลี่ยนกระเบื้องห้องน้ำ" },
  { id: "2", code: "RN-2026-002", address: "45/8 ถนนรามอินทรา", district: "คันนายาว", customerName: "สมชาย ใจดี", status: "ตรวจงานก่อนนำขาย", purchasePrice: 2800000, salePrice: 4500000, progress: 95 },
  { id: "3", code: "RN-2026-003", address: "88 หมู่บ้านพฤกษา", district: "บางบัวทอง", customerName: "พิมพ์ใจ ดีมาก", status: "ออกแบบ", purchasePrice: 2100000, progress: 20 },
  { id: "4", code: "RN-2026-004", address: "12/3 ซอยสุขุมวิท 101", district: "บางนา", customerName: "ศิริพร แสงทอง", status: "บ้านเข้าใหม่", purchasePrice: 4100000, progress: 5 },
  { id: "5", code: "RN-2026-005", address: "56 ถนนพหลโยธิน", district: "สายไหม", customerName: "มานะ รุ่งเรือง", status: "ส่งมอบให้ลูกค้า", purchasePrice: 2500000, salePrice: 3900000, progress: 100 },
  { id: "6", code: "RN-2026-006", address: "9/2 ซอยอารีย์", district: "พญาไท", customerName: "วิภา สุขใจ", status: "หลังการขาย", purchasePrice: 3800000, salePrice: 5500000, progress: 100 },
  { id: "7", code: "RN-2026-007", address: "77 หมู่บ้านมัณฑนา", district: "บางใหญ่", customerName: "ธนพล เจริญสุข", status: "เตรียมงาน", purchasePrice: 2300000, progress: 30 },
  { id: "8", code: "RN-2026-008", address: "34 ซอยทองหล่อ 10", district: "คลองเตย", customerName: "อรุณี มั่งมี", status: "นัดสำรวจ", purchasePrice: 5200000, progress: 10 },
];

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

const STORAGE_KEY = "renovation-crm-properties";

export function isHandoverStatus(status: PropertyStatus): boolean {
  return status === "ส่งมอบให้ลูกค้า" || status === "หลังการขาย";
}

export function resolveCustomerName(property: {
  id?: string;
  code?: string;
  customerName?: string;
}): string {
  const direct = property.customerName?.trim();
  if (direct) return direct;
  const seed = INITIAL_PROPERTIES.find(
    (item) =>
      (property.id && item.id === property.id) ||
      (property.code && item.code === property.code)
  );
  if (seed?.customerName.trim()) return seed.customerName.trim();
  return "ลูกค้าไม่ระบุชื่อ";
}

function hydrateProperty(property: Property): Property {
  return { ...property, customerName: resolveCustomerName(property) };
}

function readStoredProperties(): Property[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Property[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadProperties(): Property[] {
  const stored = readStoredProperties();
  return (stored ?? INITIAL_PROPERTIES).map(hydrateProperty);
}

export type HandoverPackageCreated = {
  propertyId: string;
  propertyCode: string;
  customerName: string;
};

export function saveProperties(properties: Property[]): HandoverPackageCreated[] {
  if (typeof window === "undefined") return [];
  const previous = readStoredProperties() ?? INITIAL_PROPERTIES;
  const previousStatus = new Map(previous.map((property) => [property.id, property.status]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));

  const created: HandoverPackageCreated[] = [];
  for (const property of properties) {
    const before = previousStatus.get(property.id);
    if (before === property.status || !isHandoverStatus(property.status)) continue;
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
