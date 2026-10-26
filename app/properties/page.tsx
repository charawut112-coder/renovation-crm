"use client";

import { useEffect, useState } from "react";
import {
  loadProperties,
  saveProperties,
  progressFromStatus,
  formatPrice,
  type Property,
  type PropertyStatus,
} from "@/lib/data";
import StatusSelect from "@/components/StatusSelect";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

  function updateStatus(id: string, status: PropertyStatus) {
    setProperties((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, status, progress: progressFromStatus(status) }
          : p
      );
      const created = saveProperties(next);
      const code = next.find((p) => p.id === id)?.code;
      const pkg = created.find((item) => item.propertyId === id);
      setToast(
        pkg
          ? `${code} → ${status} · สร้าง Warranty ให้ ${pkg.customerName}`
          : `${code} → ${status}`
      );
      setTimeout(() => setToast(null), 2500);
      return next;
    });
  }

  function resetData() {
    if (!confirm("รีเซ็ตข้อมูลกลับค่าเริ่มต้น?")) return;
    localStorage.removeItem("renovation-crm-properties");
    setProperties(loadProperties());
    setToast("รีเซ็ตข้อมูลแล้ว");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="p-8 relative">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บ้านทั้งหมด</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            เปลี่ยนสถานะจากคอลัมน์สถานะ · บันทึกอัตโนมัติ
          </p>
        </div>
        <button
          onClick={resetData}
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5"
        >
          รีเซ็ตข้อมูล
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          อัปเดตแล้ว: {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">รหัส</th>
              <th className="text-left px-4 py-3 font-medium">ที่อยู่</th>
              <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium">ต้นทุน</th>
              <th className="text-right px-4 py-3 font-medium">ราคาขาย</th>
              <th className="text-center px-4 py-3 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-brand-600">{p.code}</td>
                <td className="px-4 py-3">
                  <div>{p.address}</div>
                  <div className="text-xs text-slate-400">{p.district}</div>
                </td>
                <td className="px-4 py-3">{p.customerName}</td>
                <td className="px-4 py-3">
                  <StatusSelect
                    value={p.status}
                    onChange={(s) => updateStatus(p.id, s)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {formatPrice(p.purchasePrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.salePrice ? formatPrice(p.salePrice) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{p.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
