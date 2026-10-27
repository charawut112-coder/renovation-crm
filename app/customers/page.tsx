"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { latestContact, type ContactEvent } from "@/lib/contacts";
import { loadCustomers, type Customer, type LeadScore } from "@/lib/customers";
import { loadProperties } from "@/lib/data";
import { formatDateTime } from "@/lib/timeline";

const scoreColor: Record<LeadScore, string> = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-slate-100 text-slate-600",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [propertyCount, setPropertyCount] = useState<Record<string, number>>({});
  const [lastTouch, setLastTouch] = useState<Record<string, ContactEvent | undefined>>({});

  useEffect(() => {
    const list = loadCustomers();
    const properties = loadProperties();
    const counts: Record<string, number> = {};
    const touches: Record<string, ContactEvent | undefined> = {};
    for (const customer of list) {
      counts[customer.id] = properties.filter(
        (p) => p.customerId === customer.id || p.code === customer.interestedPropertyCode
      ).length;
      touches[customer.id] = latestContact(customer.id);
    }
    setCustomers(list);
    setPropertyCount(counts);
    setLastTouch(touches);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">ลูกค้า / ลีด (Customer 360°)</h1>
      <p className="text-slate-500 mb-6 text-sm">
        ความชอบ, บ้านที่เชื่อม, ประวัติการติดต่อ และไทม์ไลน์ — บันทึกจาก Lead Agent จะเพิ่มลูกค้าใหม่ให้อัตโนมัติ
      </p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium">ติดต่อ</th>
              <th className="text-left px-4 py-3 font-medium">คะแนนลีด</th>
              <th className="text-left px-4 py-3 font-medium">งบ / ทำเล</th>
              <th className="text-left px-4 py-3 font-medium">วัตถุประสงค์</th>
              <th className="text-left px-4 py-3 font-medium">แหล่งที่มา</th>
              <th className="text-left px-4 py-3 font-medium">ติดต่อล่าสุด</th>
              <th className="text-left px-4 py-3 font-medium">บ้านที่สนใจ</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="font-medium text-brand-600 hover:underline">
                    {c.fullName}
                  </Link>
                  {c.notes && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2 max-w-xs">{c.notes}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{c.phone || "—"}</div>
                  {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${scoreColor[c.leadScore]}`}>
                    {c.leadScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>{c.budget || "—"}</div>
                  <div className="text-xs text-slate-400">{c.preferredLocation || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{c.purpose || "—"}</div>
                  {c.timeline && <div className="text-xs text-slate-400">{c.timeline}</div>}
                </td>
                <td className="px-4 py-3">{c.source}</td>
                <td className="px-4 py-3">
                  {lastTouch[c.id] ? (
                    <>
                      <div className="text-slate-700">
                        {lastTouch[c.id]?.channel}: {lastTouch[c.id]?.summary}
                      </div>
                      <div className="text-[11px] text-slate-400">{formatDateTime(lastTouch[c.id]?.createdAt)}</div>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-brand-600">{c.interestedPropertyCode || "—"}</div>
                  <div className="text-[11px] text-slate-400">{propertyCount[c.id] || 0} หลังที่เชื่อม</div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  กำลังโหลด...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
