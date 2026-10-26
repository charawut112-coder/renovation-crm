"use client";

import { useEffect, useState } from "react";
import {
  PIPELINE_STATUSES,
  loadProperties,
  saveProperties,
  progressFromStatus,
  formatPrice,
  type Property,
  type PropertyStatus,
} from "@/lib/data";
import StatusSelect from "@/components/StatusSelect";

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

  function updateStatus(id: string, status: PropertyStatus) {
    setProperties((prev) => {
      const current = prev.find((p) => p.id === id);
      if (!current || current.status === status) return prev;
      const next = prev.map((p) =>
        p.id === id ? { ...p, status, progress: progressFromStatus(status) } : p
      );
      const created = saveProperties(next);
      const pkg = created.find((item) => item.propertyId === id);
      setToast(
        pkg
          ? `${current.code} → ${status} · สร้าง Warranty ให้ ${pkg.customerName}`
          : `${current.code} → ${status}`
      );
      setTimeout(() => setToast(null), 2800);
      return next;
    });
  }

  const byStatus = PIPELINE_STATUSES.map((s) => ({
    status: s,
    count: properties.filter((p) => p.status === s).length,
  }));
  const totalValue = properties.reduce(
    (sum, p) => sum + (p.salePrice || p.purchasePrice),
    0
  );
  const inProgress = properties.filter(
    (p) => p.status !== "หลังการขาย" && p.progress < 100
  ).length;

  return (
    <div className="p-8 relative">
      {toast && (
        <div className="fixed top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          อัปเดตแล้ว: {toast}
        </div>
      )}
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">ภาพรวมธุรกิจรีโนเวทบ้านเพื่อขาย</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card title="บ้านทั้งหมด" value={String(properties.length || "—")} accent="text-brand-600" />
        <Card title="กำลังดำเนินการ" value={String(inProgress)} accent="text-orange-500" />
        <Card
          title="มูลค่ารวม (โดยประมาณ)"
          value={properties.length ? formatPrice(totalValue) : "—"}
          accent="text-slate-800"
        />
        <Card
          title="พร้อมขาย / ส่งมอบ"
          value={String(
            properties.filter(
              (p) =>
                p.status === "ตรวจงานก่อนนำขาย" ||
                p.status === "ส่งมอบให้ลูกค้า"
            ).length
          )}
          accent="text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Pipeline Snapshot</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {byStatus.map((s) => (
            <div key={s.status} className="text-center p-3 rounded-lg bg-slate-50">
              <div className="text-2xl font-bold text-brand-600">{s.count}</div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">
                {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 mt-6 overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">อัปเดตสถานะ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เมื่อสถานะเป็นส่งมอบให้ลูกค้า หรือ หลังการขาย ระบบสร้าง Warranty และ Follow-up ให้ชื่อลูกค้าของบ้านนั้นครั้งเดียว
          </p>
        </div>
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">รหัส</th>
              <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium">ที่อยู่</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-brand-600">{p.code}</td>
                <td className="px-4 py-3">{p.customerName}</td>
                <td className="px-4 py-3">
                  <div>{p.address}</div>
                  <div className="text-xs text-slate-400">{p.district}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusSelect value={p.status} onChange={(status) => updateStatus(p.id, status)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        MVP v0.1 — เปลี่ยนสถานะได้ที่ Dashboard, Pipeline, หรือบ้านทั้งหมด · ข้อมูลเก็บในเบราว์เซอร์
      </p>
    </div>
  );
}

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`text-xl font-bold mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}
