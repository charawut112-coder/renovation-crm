"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSchedule, type ScheduleEntry } from "@/lib/aftersales";
import { formatDate } from "@/lib/timeline";

export default function ScheduleList({ reloadToken = 0 }: { reloadToken?: number }) {
  const [rows, setRows] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    setRows(loadSchedule());
  }, [reloadToken]);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีนัด Follow-up หรือวันเข้าซ่อม</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="text-left px-4 py-3 font-medium">วันที่</th>
            <th className="text-left px-4 py-3 font-medium">ประเภท</th>
            <th className="text-left px-4 py-3 font-medium">รายการ</th>
            <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
            <th className="text-left px-4 py-3 font-medium">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`} className="border-t border-slate-100">
              <td className="px-4 py-3 whitespace-nowrap">
                <div>{formatDate(row.date)}</div>
                {row.overdue && <div className="text-[11px] text-red-600 font-medium">เลยกำหนด</div>}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.kind === "followup" ? "Follow-up" : "นัดซ่อม"}</td>
              <td className="px-4 py-3">
                <div className="text-slate-800">{row.title}</div>
                <div className="text-xs text-slate-400">{row.propertyCode}</div>
              </td>
              <td className="px-4 py-3">{row.customerName}</td>
              <td className="px-4 py-3">
                {row.done ? (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">เสร็จแล้ว</span>
                ) : (
                  <Link href="/after-sales" className="text-xs text-brand-600 hover:underline">
                    รอดำเนินการ
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
