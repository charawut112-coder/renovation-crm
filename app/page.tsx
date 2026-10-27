"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useOps } from "@/components/ops/useOps";
import { PageHead, Pill, Stat } from "@/components/ops/ui";
import { resetOpsState } from "@/lib/opsStore";
import { formatMoney } from "@/lib/format";
import { loadPropertyViews } from "@/lib/views";

export default function DashboardPage() {
  const { view, reload } = useOps();
  const [saleLate, setSaleLate] = useState(0);
  const [saleCount, setSaleCount] = useState(0);

  useEffect(() => {
    const rows = loadPropertyViews();
    setSaleCount(rows.length);
    setSaleLate(rows.filter((row) => row.timing.late).length);
  }, []);

  if (!view) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-slate-500">กำลังคำนวณตัวเลขจาก snapshot…</p>
      </div>
    );
  }

  const { kpis } = view;

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <PageHead
        title="แดชบอร์ด"
        subtitle={`ตัวเลขคำนวณจากชีต BUILDSPACE_data ณ ${view.generatedAt} ไม่ได้ฝังค่า KPI ตายตัว การบันทึกในแอปเก็บในเบราว์เซอร์เครื่องนี้`}
      >
        <button
          type="button"
          className="text-xs text-slate-500 underline"
          onClick={() => {
            resetOpsState();
            reload();
          }}
        >
          ล้างข้อมูลที่บันทึกในเบราว์เซอร์
        </button>
      </PageHead>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="บ้านในชีตสถานะบ้าน" value={String(kpis.housesOnSheet)} hint="นับทุกแถว รวมแถวที่โครงการ+เลขที่ซ้ำ" />
        <Stat label="งานล่าช้า" value={String(kpis.lateCount)} tone={kpis.lateCount ? "warn" : "good"} hint="เลื่อนวันเข้า, แบบค้างแก้ไข, เลยกำหนดส่ง" />
        <Stat label="After-Sales ค้าง" value={String(kpis.openAfterSales)} tone={kpis.openAfterSales ? "warn" : "good"} hint="สถานะที่ยังไม่ปิดในชีตหรือในแอป" />
        <Stat label="สต็อกถึงจุดสั่งซื้อ" value={String(kpis.lowStock)} tone={kpis.lowStock ? "warn" : "good"} hint={`มูลค่าคงเหลือ ${formatMoney(kpis.stockValue)}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 mb-3">จำนวนบ้านตามสถานะ</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {kpis.byHouseStatus.map((row) => (
              <div key={row.status} className="rounded-lg bg-slate-50 p-3">
                <div className="text-2xl font-bold text-brand-600">{row.count}</div>
                <div className="text-xs text-slate-500 mt-1">{row.status}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-800 mb-3">ขั้นงานทั้งพอร์ต</h2>
          <div className="grid grid-cols-3 gap-2">
            {kpis.byStep.map((row) => (
              <Link key={row.step} href="/work" className="rounded-lg bg-slate-50 p-2 hover:bg-brand-50">
                <div className="text-lg font-bold text-slate-800">{row.count}</div>
                <div className="text-[11px] text-slate-500 leading-tight">{row.step}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">งานล่าช้า</h2>
            <Link href="/work" className="text-xs text-brand-600 hover:underline">
              ดูสถานะงาน
            </Link>
          </div>
          {view.lateItems.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีงานที่เข้าเกณฑ์ล่าช้า</p>}
          <ul className="space-y-2">
            {view.lateItems.slice(0, 8).map((item) => (
              <li key={item.id} className="text-sm">
                <Link href={item.href} className="text-brand-600 hover:underline">
                  {item.label}
                </Link>
                <span className="text-slate-500"> · {item.kind} · {item.detail}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">สต็อกถึงจุดสั่งซื้อ</h2>
            <Link href="/stock" className="text-xs text-brand-600 hover:underline">
              เปิดคลัง
            </Link>
          </div>
          {view.lowStock.length === 0 && <p className="text-sm text-slate-500">ไม่มีรายการต่ำกว่าจุดสั่งซื้อ</p>}
          <ul className="space-y-2">
            {view.lowStock.slice(0, 8).map((item) => (
              <li key={item.id} className="text-sm flex justify-between gap-3">
                <span>
                  {item.name} <span className="text-slate-400">{item.code}</span>
                </span>
                <span className="text-red-600 shrink-0">
                  {item.onHand}/{item.reorderPoint} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800">ไปป์ไลน์ขาย (Phase 2)</h2>
          <p className="text-sm text-slate-500 mt-1">
            บ้านในโมเดลขาย {saleCount} หลัง · ล่าช้าตามแผน {saleLate} หลัง — คนละชุดกับบ้านหน้างาน BUILDSPACE
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pipeline" className="text-sm text-brand-600 hover:underline">
            เปิดบอร์ดขาย
          </Link>
          <Pill>คงไว้จากเฟสก่อน</Pill>
        </div>
      </section>
    </div>
  );
}
