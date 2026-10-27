"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { StepEditor } from "@/components/ops/StepEditor";
import { useOps } from "@/components/ops/useOps";
import { Empty, PageHead, Pill, TextInput } from "@/components/ops/ui";
import { WORK_STEPS } from "@/lib/ops";
import { formatIsoDate } from "@/lib/format";

export default function WorkPage() {
  const { view, reload } = useOps();
  const [q, setQ] = useState("");
  const [step, setStep] = useState("ทั้งหมด");
  const [lateOnly, setLateOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!view) return [];
    return view.houses.filter((house) => {
      if (step !== "ทั้งหมด" && house.step !== step) return false;
      if (lateOnly && !house.late) return false;
      const blob = `${house.label} ${house.stepOwner} ${house.craftsman}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [view, q, step, lateOnly]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดสถานะงาน…</div>;

  return (
    <div className="p-4 sm:p-8">
      <PageHead
        title="สถานะงานหลายหลัง"
        subtitle="เก้าขั้นเดียวกับไปป์ไลน์ขาย ผูกผู้รับผิดชอบและกำหนดส่งรายขั้น บ้านที่ไม่มีวันในชีตจะไม่ถูกนับว่าล่าช้าจนกว่าจะใส่วันหรือเข้าสถานะเลื่อนงาน"
      />
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {view.kpis.byStep.map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={() => setStep(item.step)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-left ${step === item.step ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}
          >
            <div className="text-lg font-bold text-slate-800">{item.count}</div>
            <div className="text-[11px] text-slate-500 w-24 leading-tight">{item.step}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <TextInput className="max-w-xs" placeholder="ค้นบ้านหรือผู้รับผิดชอบ" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={step} onChange={(event) => setStep(event.target.value)}>
          <option>ทั้งหมด</option>
          {WORK_STEPS.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={lateOnly} onChange={(event) => setLateOnly(event.target.checked)} />
          เฉพาะงานล่าช้า
        </label>
      </div>
      {rows.length === 0 && <Empty title="ไม่มีบ้านในตัวกรองนี้" />}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">บ้าน</th>
              <th className="text-left px-4 py-3 font-medium">ขั้นปัจจุบัน</th>
              <th className="text-left px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
              <th className="text-left px-4 py-3 font-medium">กำหนดส่ง</th>
              <th className="text-left px-4 py-3 font-medium">สถานะขั้น</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((house) => {
              const current = house.steps.find((item) => item.state === "current");
              const open = openId === house.id;
              return (
                <Fragment key={house.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link href={`/houses/${house.id}`} className="text-brand-600 font-medium hover:underline">
                        {house.project} {house.houseNo}
                      </Link>
                      <div className="text-xs text-slate-400">{house.houseStatus}</div>
                    </td>
                    <td className="px-4 py-3">{house.step}</td>
                    <td className="px-4 py-3">{house.stepOwner || "—"}</td>
                    <td className="px-4 py-3">{house.stepDue ? formatIsoDate(house.stepDue) : "—"}</td>
                    <td className="px-4 py-3">
                      {current?.late ? <Pill tone="red">ล่าช้า</Pill> : <Pill tone="blue">กำลังทำ</Pill>}
                      <button type="button" className="block text-xs text-brand-600 mt-1 hover:underline" onClick={() => setOpenId(open ? null : house.id)}>
                        {open ? "ซ่อนทุกรายขั้น" : "ดูสถานะทีละขั้น"}
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        <StepEditor house={house} onChange={reload} />
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
  );
}
