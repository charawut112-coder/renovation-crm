"use client";

import { useEffect, useState } from "react";
import {
  PIPELINE_STATUSES,
  loadProperties,
  formatPrice,
  type Property,
} from "@/lib/data";

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    setProperties(loadProperties());
  }, []);

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
    <div className="p-8">
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

      <p className="mt-6 text-sm text-slate-400">
        MVP v0.1 — เปลี่ยนสถานะได้ที่ Pipeline / บ้านทั้งหมด · ข้อมูลเก็บในเบราว์เซอร์
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
