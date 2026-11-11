"use client";

import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { PageHead, Pill } from "@/components/ops/ui";
import { resetOpsState } from "@/lib/opsStore";
import { formatMoney } from "@/lib/format";

const UNIT_SOFT: Record<string, string> = {
  design: "border-indigo-200 bg-indigo-50",
  construction: "border-orange-200 bg-orange-50",
  sales: "border-emerald-200 bg-emerald-50",
  aftersales: "border-teal-200 bg-teal-50",
  stock: "border-violet-200 bg-violet-50",
};

export default function DashboardPage() {
  const { view, reload } = useOps();

  if (!view) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-slate-500">กำลังคำนวณตัวเลขจาก snapshot…</p>
      </div>
    );
  }

  const { kpis } = view;
  const bottlenecks = kpis.byUnit.filter((unit) => unit.late > 0);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHead
        title="แดชบอร์ด"
        subtitle={`ภาพรวมห้าหน่วยงานจากบ้านหลังเดียวกัน · snapshot ${view.generatedAt} การส่งต่อที่กดในแอปเก็บบนเบราว์เซอร์เครื่องนี้`}
      >
        <button
          type="button"
          className="min-h-11 cursor-pointer text-sm text-slate-600 underline"
          onClick={() => {
            resetOpsState();
            reload();
          }}
        >
          ล้างข้อมูลที่บันทึกในเบราว์เซอร์
        </button>
      </PageHead>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.byUnit.map((unit) => (
          <Link
            key={unit.id}
            href={unit.href}
            className={`rounded-2xl border p-4 transition-colors duration-150 hover:border-slate-400 ${UNIT_SOFT[unit.id] || "border-slate-200 bg-white"}`}
          >
            <div className="text-xs font-medium text-slate-600">{unit.label}</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{unit.count}</div>
            <p className="mt-2 text-sm text-slate-700">{unit.bottleneck}</p>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-slate-900">จุดที่ติดอยู่</h2>
          {bottlenecks.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีคิวที่เข้าเกณฑ์คอขวด</p>}
          <ul className="space-y-2">
            {bottlenecks.map((unit) => (
              <li key={unit.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium text-slate-900">{unit.label}</span>
                  <span className="text-slate-600"> · {unit.bottleneck}</span>
                </span>
                <Link href={unit.href} className="shrink-0 text-brand-700 hover:underline">
                  เปิด
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">งานล่าช้า</h2>
            <span className="text-sm text-slate-500">{kpis.lateCount} รายการ</span>
          </div>
          {view.lateItems.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีงานที่เข้าเกณฑ์ล่าช้า</p>}
          <ul className="space-y-2">
            {view.lateItems.slice(0, 8).map((item) => (
              <li key={item.id} className="text-sm">
                <Link href={item.href} className="font-medium text-brand-700 hover:underline">
                  {item.label}
                </Link>
                <span className="text-slate-600">
                  {" "}
                  · {item.kind} · {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">สต็อกถึงจุดสั่งซื้อ</h2>
            <Link href="/stock" className="text-sm text-brand-700 hover:underline">
              เปิดคลัง
            </Link>
          </div>
          <p className="mb-2 text-xs text-slate-500">มูลค่าคงเหลือ {formatMoney(kpis.stockValue)} · เบิกของผูกบ้านในงานก่อสร้าง</p>
          {view.lowStock.length === 0 && <p className="text-sm text-slate-500">ไม่มีรายการต่ำกว่าจุดสั่งซื้อ</p>}
          <ul className="space-y-2">
            {view.lowStock.slice(0, 8).map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.name} <span className="text-slate-400">{item.code}</span>
                </span>
                <span className="shrink-0 text-red-700">
                  {item.onHand}/{item.reorderPoint} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">จำนวนบ้านตามสถานะในชีต</h2>
            <Pill>ชีตสถานะบ้าน {kpis.housesOnSheet}</Pill>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kpis.byHouseStatus.map((row) => (
              <div key={row.status} className="rounded-xl bg-slate-50 p-3">
                <div className="text-2xl font-semibold text-slate-900">{row.count}</div>
                <div className="mt-1 text-xs text-slate-600">{row.status}</div>
              </div>
            ))}
          </div>
          <Link href="/agent" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-700 hover:underline">
            ถาม AI Agent ข้ามหน่วยงาน
          </Link>
        </section>
      </div>
    </div>
  );
}
