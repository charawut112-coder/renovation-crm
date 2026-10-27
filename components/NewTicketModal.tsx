"use client";

import { useEffect, useState } from "react";
import {
  TICKET_ASSIGNEES,
  WARRANTY_POLICY,
  type TicketPriority,
  type WarrantyCategory,
} from "@/lib/aftersales";
import { loadCustomers } from "@/lib/customers";
import { loadProperties, type Property } from "@/lib/data";

export type NewTicketInput = {
  propertyCode: string;
  propertyId: string;
  customerName: string;
  customerId?: string;
  customerPhone: string;
  title: string;
  description: string;
  priority: TicketPriority;
  underWarranty: boolean;
  warrantyCategory?: WarrantyCategory;
  assignedTo?: string;
  scheduledDate?: string;
};

const CATEGORIES: WarrantyCategory[] = [...WARRANTY_POLICY.map((item) => item.category), "อื่นๆ"];

export default function NewTicketModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: NewTicketInput) => void;
}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyCode, setPropertyCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [customerPhone, setCustomerPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [underWarranty, setUnderWarranty] = useState(true);
  const [warrantyCategory, setWarrantyCategory] = useState<WarrantyCategory>("ประปา");
  const [assignedTo, setAssignedTo] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const list = loadProperties();
    setProperties(list);
    const first = list.find((item) => item.code === "RN-2026-006") || list[0];
    if (first) applyProperty(first.code, list);
  }, []);

  function applyProperty(code: string, list = properties) {
    setPropertyCode(code);
    const property = list.find((item) => item.code === code);
    if (!property) return;
    const customer = loadCustomers().find((item) => item.id === property.customerId);
    setCustomerName(customer?.fullName || property.customerName);
    setCustomerPhone(customer?.phone || "");
    setCustomerId(customer?.id || property.customerId);
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg">Ticket ซ่อมใหม่</h3>
        <label className="block text-xs text-slate-600 space-y-1">
          <span>บ้าน</span>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={propertyCode}
            onChange={(event) => applyProperty(event.target.value)}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.code}>
                {property.code} · {property.customerName}
              </option>
            ))}
          </select>
        </label>
        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="ชื่อลูกค้า" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="เบอร์โทร" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="หัวข้อปัญหา" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          <option value="urgent">เร่งด่วน</option>
          <option value="high">สูง</option>
          <option value="medium">ปานกลาง</option>
          <option value="low">ต่ำ</option>
        </select>
        <label className="block text-xs text-slate-600 space-y-1">
          <span>มอบหมายช่าง</span>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">ยังไม่มอบหมาย</option>
            {TICKET_ASSIGNEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-600 space-y-1">
          <span>วันนัดซ่อม</span>
          <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={underWarranty} onChange={(e) => setUnderWarranty(e.target.checked)} />
          อยู่ในระยะรับประกัน
        </label>
        {underWarranty && (
          <label className="block text-xs text-slate-600 space-y-1">
            <span>หมวดรับประกัน</span>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={warrantyCategory}
              onChange={(event) => setWarrantyCategory(event.target.value as WarrantyCategory)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              if (!title.trim()) {
                setError("กรอกหัวข้อปัญหา");
                return;
              }
              if (!propertyCode) {
                setError("เลือกบ้าน");
                return;
              }
              const property = properties.find((item) => item.code === propertyCode);
              onSubmit({
                propertyCode,
                propertyId: property?.id || "unknown",
                customerName: customerName.trim() || "ลูกค้า",
                customerId,
                customerPhone,
                title: title.trim(),
                description,
                priority,
                underWarranty,
                warrantyCategory: underWarranty ? warrantyCategory : undefined,
                assignedTo: assignedTo || undefined,
                scheduledDate: scheduledDate || undefined,
              });
            }}
            className="text-sm px-3 py-1.5 bg-brand-600 text-white rounded-lg"
          >
            สร้าง Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
