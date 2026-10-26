"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LateBadge from "@/components/LateBadge";
import ProgressMeter from "@/components/ProgressMeter";
import StatusChanger from "@/components/StatusChanger";
import { formatPrice, resolveCustomerName } from "@/lib/data";
import type { ChangeStatusResult } from "@/lib/pipeline";
import { resetPropertyWorkspace } from "@/lib/reset";
import { loadPropertyViews, type PropertyView } from "@/lib/views";

export default function PropertiesPage() {
  const [rows, setRows] = useState<PropertyView[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function refresh() {
    setRows(loadPropertyViews());
  }

  useEffect(() => {
    refresh();
  }, []);

  function onResult(result: ChangeStatusResult) {
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    if (result.changed) setBanner(null);
  }

  function resetData() {
    if (!confirm("รีเซ็ตบ้าน checklist timeline ไฟล์ และประวัติสถานะกลับค่าเริ่มต้น?")) return;
    resetPropertyWorkspace();
    refresh();
    setBanner(null);
    setToast("รีเซ็ตข้อมูลบ้านแล้ว");
    window.setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="p-8 relative">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บ้านทั้งหมด</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            เปลี่ยนสถานะได้ทีละขั้นผ่านกฎเดียวกัน · checklist ไม่ครบจะขยับไม่ได้
          </p>
        </div>
        <button
          onClick={resetData}
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5"
        >
          รีเซ็ตข้อมูล
        </button>
      </div>

      {banner && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{banner}</div>
      )}
      {toast && (
        <div className="fixed top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          อัปเดตแล้ว: {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">รหัส</th>
              <th className="text-left px-4 py-3 font-medium">ที่อยู่</th>
              <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium">ต้นทุน</th>
              <th className="text-right px-4 py-3 font-medium">ราคาขาย</th>
              <th className="text-left px-4 py-3 font-medium">ตามแผน</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const p = row.property;
              const customer = resolveCustomerName(p, undefined, "");
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}`} className="font-medium text-brand-600 hover:underline">
                      {p.code}
                    </Link>
                    <div className="mt-1">
                      <LateBadge late={row.timing.late} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{p.address}</div>
                    <div className="text-xs text-slate-400">{p.district}</div>
                  </td>
                  <td className="px-4 py-3">
                    {p.customerId ? (
                      <Link href={`/customers/${p.customerId}`} className="text-brand-600 hover:underline">
                        {customer || "ลูกค้า"}
                      </Link>
                    ) : (
                      <span className="text-slate-400">ยังไม่ระบุ</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChanger propertyId={p.id} status={p.status} onChanged={refresh} onResult={onResult} />
                  </td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right">{p.salePrice ? formatPrice(p.salePrice) : "—"}</td>
                  <td className="px-4 py-3">
                    <ProgressMeter
                      progress={row.timing.progress}
                      late={row.timing.late}
                      label={`${row.timing.doneCount}/${row.timing.total}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
