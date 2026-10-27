"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import LateBadge from "@/components/LateBadge";
import ProgressMeter from "@/components/ProgressMeter";
import StatusChanger from "@/components/StatusChanger";
import StatusDetail from "@/components/StatusDetail";
import { canAdvance } from "@/lib/checklist";
import { PIPELINE_STATUSES, formatPrice } from "@/lib/data";
import type { ChangeStatusResult } from "@/lib/pipeline";
import { loadPropertyViews, type PropertyView } from "@/lib/views";

export default function DashboardPage() {
  const [rows, setRows] = useState<PropertyView[]>([]);
  const [gaps, setGaps] = useState<Record<string, { ok: boolean; missing: string[] }>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function refresh() {
    const next = loadPropertyViews();
    const gate: Record<string, { ok: boolean; missing: string[] }> = {};
    for (const row of next) {
      const result = canAdvance({ ...row.property, checklistDone: row.checklistDone });
      gate[row.property.id] = { ok: result.ok, missing: result.missing };
    }
    setRows(next);
    setGaps(gate);
  }

  useEffect(() => {
    refresh();
  }, []);

  function onResult(result: ChangeStatusResult, propertyId: string, code: string) {
    if (!result.ok) {
      setBanner(`${code}: ${result.error}`);
      setExpandedId(propertyId);
      return;
    }
    if (result.changed) setBanner(null);
  }

  const properties = rows.map((r) => r.property);
  const byStatus = PIPELINE_STATUSES.map((s) => ({
    status: s,
    count: properties.filter((p) => p.status === s).length,
  }));
  const totalValue = properties.reduce((sum, p) => sum + (p.salePrice || p.purchasePrice), 0);
  const inProgress = rows.filter((r) => r.property.status !== "หลังการขาย" && r.timing.progress < 100).length;
  const lateCount = rows.filter((r) => r.timing.late).length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">ภาพรวมธุรกิจรีโนเวทบ้านเพื่อขาย · เปลี่ยนสถานะผ่านกฎ checklist เดียวกันทั้งระบบ</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card title="บ้านทั้งหมด" value={String(properties.length || "—")} accent="text-brand-600" />
        <Card title="กำลังดำเนินการ" value={String(inProgress)} accent="text-orange-500" />
        <Card title="บ้านล่าช้า" value={String(lateCount)} accent={lateCount ? "text-red-600" : "text-slate-800"} />
        <Card title="มูลค่ารวม (โดยประมาณ)" value={properties.length ? formatPrice(totalValue) : "—"} accent="text-slate-800" />
        <Card
          title="พร้อมขาย / ส่งมอบ"
          value={String(
            properties.filter((p) => p.status === "ตรวจงานก่อนนำขาย" || p.status === "ส่งมอบให้ลูกค้า").length
          )}
          accent="text-green-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Pipeline Snapshot</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {byStatus.map((s) => (
            <div key={s.status} className="text-center p-3 rounded-lg bg-slate-50">
              <div className="text-2xl font-bold text-brand-600">{s.count}</div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">{s.status}</div>
            </div>
          ))}
        </div>
      </div>

      {banner && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <span>{banner}</span>
          <button type="button" className="text-xs underline shrink-0" onClick={() => setBanner(null)}>
            ปิด
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">บ้านในระบบ</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เลื่อนขั้นได้เมื่อ checklist ของสถานะปัจจุบันครบ · ย้อนขั้นต้องใส่เหตุผล · ห้ามข้ามสถานะ
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">รหัส</th>
                <th className="text-left px-4 py-3 font-medium">ที่อยู่</th>
                <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                <th className="text-left px-4 py-3 font-medium">แผน vs จริง</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const advance = gaps[row.property.id] || { ok: false, missing: [] };
                const open = expandedId === row.property.id;
                return (
                  <Fragment key={row.property.id}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <Link href={`/properties/${row.property.id}`} className="font-medium text-brand-600 hover:underline">
                          {row.property.code}
                        </Link>
                        <div className="mt-1">
                          <LateBadge late={row.timing.late} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{row.property.address}</div>
                        <div className="text-xs text-slate-400">{row.property.district}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChanger
                          propertyId={row.property.id}
                          status={row.property.status}
                          onChanged={refresh}
                          onResult={(result) => onResult(result, row.property.id, row.property.code)}
                        />
                        <button
                          type="button"
                          className="mt-1 block text-[11px] text-brand-600 hover:underline"
                          onClick={() => setExpandedId(open ? null : row.property.id)}
                        >
                          {open ? "ซ่อน checklist" : advance.ok ? "checklist ครบ" : `checklist ขาด ${advance.missing.length}`}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <ProgressMeter progress={row.timing.progress} late={row.timing.late} />
                        <div className="text-[11px] text-slate-400 mt-1">
                          จริง {row.timing.doneCount}/{row.timing.total} ขั้น · แผน {row.timing.expectedCount}/{row.timing.total}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-4 py-3">
                          <StatusDetail propertyId={row.property.id} status={row.property.status} onChange={refresh} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`text-xl font-bold mt-0.5 ${accent}`}>{value}</div>
    </div>
  );
}
