"use client";

import { useState } from "react";
import type { TicketPriority } from "@/lib/aftersales";

export default function NewTicketModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (f: {
    propertyCode: string;
    customerName: string;
    customerPhone: string;
    title: string;
    description: string;
    priority: TicketPriority;
    underWarranty: boolean;
  }) => void;
}) {
  const [propertyCode, setPropertyCode] = useState("RN-2026-006");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [underWarranty, setUnderWarranty] = useState(true);

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3">
        <h3 className="font-semibold text-lg">Ticket ซ่อมใหม่</h3>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="รหัสบ้าน" value={propertyCode} onChange={(e) => setPropertyCode(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ชื่อลูกค้า" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="เบอร์โทร" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="หัวข้อปัญหา" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className="w-full border rounded-lg px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          <option value="urgent">เร่งด่วน</option>
          <option value="high">สูง</option>
          <option value="medium">ปานกลาง</option>
          <option value="low">ต่ำ</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={underWarranty} onChange={(e) => setUnderWarranty(e.target.checked)} />
          อยู่ในระยะรับประกัน
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border rounded-lg">ยกเลิก</button>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onSubmit({ propertyCode, customerName: customerName || "ลูกค้า", customerPhone, title, description, priority, underWarranty });
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
