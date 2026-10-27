"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { Empty, PageHead, Pill, TextInput } from "@/components/ops/ui";

export default function HousesPage() {
  const { view } = useOps();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ทั้งหมด");
  const [project, setProject] = useState("ทั้งหมด");

  const projects = useMemo(() => {
    if (!view) return [];
    return Array.from(new Set(view.houses.map((house) => house.project))).sort((a, b) => a.localeCompare(b, "th"));
  }, [view]);

  const rows = useMemo(() => {
    if (!view) return [];
    return view.houses.filter((house) => {
      if (status !== "ทั้งหมด" && house.houseStatus !== status) return false;
      if (project !== "ทั้งหมด" && house.project !== project) return false;
      const blob = `${house.label} ${house.type} ${house.craftsman} ${house.step}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [view, q, status, project]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดบ้าน…</div>;

  const statuses = Array.from(new Set(view.houses.map((house) => house.houseStatus)));

  return (
    <div className="p-4 sm:p-8">
      <PageHead
        title="ลูกค้าและบ้าน"
        subtitle="ชีตไม่มีทะเบียนลูกค้าแยก ระบบใช้โครงการเป็นกลุ่มลูกค้า และรวมประวัติบ้าน ข้อตกลง และเอกสารไว้หลังเดียวกัน"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <TextInput className="max-w-xs" placeholder="ค้นโครงการ เลขที่ ช่าง" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={project} onChange={(event) => setProject(event.target.value)}>
          <option>ทั้งหมด</option>
          {projects.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>ทั้งหมด</option>
          {statuses.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 && <Empty title="ไม่พบบ้าน">ปรับคำค้นหรือตัวกรอง</Empty>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">กลุ่มลูกค้า / บ้าน</th>
              <th className="text-left px-4 py-3 font-medium">สถานะบ้าน</th>
              <th className="text-left px-4 py-3 font-medium">ขั้นงาน</th>
              <th className="text-left px-4 py-3 font-medium">ช่าง</th>
              <th className="text-left px-4 py-3 font-medium">แจ้งซ่อมเปิด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((house) => (
              <tr key={house.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/houses/${house.id}`} className="font-medium text-brand-600 hover:underline">
                    {house.project}
                  </Link>
                  <div className="text-slate-700">
                    {house.houseNo}
                    {house.soi ? ` · ${house.soi}` : ""} {house.type ? `· ${house.type}` : ""}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {house.source}
                    {house.duplicate ? " · ข้อมูลซ้ำในชีต" : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{house.houseStatus}</div>
                  {house.signStatus && <div className="text-xs text-slate-400">{house.signStatus}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{house.step}</div>
                  {house.late && <Pill tone="red">มีงานล่าช้า</Pill>}
                </td>
                <td className="px-4 py-3">{house.craftsman || "—"}</td>
                <td className="px-4 py-3">{house.openTickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
