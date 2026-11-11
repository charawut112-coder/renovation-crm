"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { PageHead, Pill } from "@/components/ops/ui";
import { CardButton, HandoffPanel, Kanban, RecentHandoffs, UnitBanner } from "@/components/units/chrome";
import { constructionColumn } from "@/lib/units";

const COLUMNS = [
  { id: "prepare", title: "เตรียมงาน", empty: "ไม่มีบ้านในขั้นเตรียมงาน" },
  { id: "build", title: "กำลังก่อสร้าง", empty: "ไม่มีบ้านที่กำลังก่อสร้าง" },
  { id: "inspect", title: "ตรวจก่อนส่งขาย", empty: "ยังไม่มีบ้านที่ถึงขั้นตรวจงาน" },
] as const;

export default function ConstructionPage() {
  const { view, reload } = useOps();
  const [openId, setOpenId] = useState<string | null>(null);

  const houses = useMemo(() => {
    if (!view) return [];
    return view.houses.filter((house) => house.flowUnit === "construction" && !house.duplicate);
  }, [view]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดงานก่อสร้าง…</div>;

  const selected = houses.find((house) => house.id === openId) || null;
  const photos = houses.flatMap((house) => house.progress).slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UnitBanner unit="construction" note="ขั้นงาน คิวช่าง และรูปความคืบหน้าของบ้านที่ส่งต่อมาจากออกแบบ เบิกวัสดุได้จากหน่วยสต็อกเฉพาะบ้านในหน่วยนี้" />
      <PageHead title="งานก่อสร้าง" subtitle="ส่งต่อไปงานขายได้เมื่อขั้นงานถึง «ตรวจงานก่อนนำขาย»">
        <div className="flex flex-wrap gap-2">
          <Link href="/work" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
            ขั้นงานละเอียด
          </Link>
          <Link href="/craftsmen" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
            คิวช่างและรูป
          </Link>
        </div>
      </PageHead>

      <Kanban
        columns={COLUMNS.map((column) => {
          const rows = houses.filter((house) => constructionColumn(house.step) === column.id);
          return {
            ...column,
            isEmpty: rows.length === 0,
            children: rows.map((house) => (
              <CardButton
                key={house.id}
                pressed={openId === house.id}
                onClick={() => setOpenId(house.id)}
                title={`${house.project} ${house.houseNo}`}
                meta={`${house.step} · ${house.craftsman || "ยังไม่ระบุช่าง"}`}
                tags={
                  <>
                    {house.late && <Pill tone="red">ล่าช้า</Pill>}
                    {house.siteStatus && <Pill tone="amber">{house.siteStatus}</Pill>}
                    {house.progress.length > 0 && <Pill tone="blue">รูป {house.progress.length}</Pill>}
                  </>
                }
              />
            )),
          };
        })}
      />

      {selected && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">{selected.label}</h2>
            <p className="mt-1 text-sm text-slate-600">
              ขั้น {selected.step} · ผู้รับผิดชอบ {selected.stepOwner || "ไม่ระบุ"} · ช่าง {selected.craftsman || "ไม่ระบุ"}
            </p>
            <p className="mt-2 text-sm text-slate-600">ต้นทุนวัสดุที่ผูกบ้าน {selected.totalCost.toLocaleString("th-TH")} บาท</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link href={`/houses/${selected.id}`} className="text-brand-700 hover:underline">
                เปิดระเบียนบ้าน
              </Link>
              <Link href="/work" className="text-brand-700 hover:underline">
                เลื่อนขั้นงาน
              </Link>
              <Link href="/stock" className="text-brand-700 hover:underline">
                เบิกวัสดุ
              </Link>
            </div>
            {selected.progress.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {selected.progress.slice(0, 3).map((item) => (
                  <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="font-medium">{item.note || "บันทึกความคืบหน้า"}</div>
                    <div className="text-xs text-slate-500">
                      {item.craftsman || "ไม่ระบุช่าง"}
                      {item.percent != null ? ` · ${item.percent}%` : ""}
                    </div>
                    {item.photoUrl && (
                      <a href={item.photoUrl} className="text-xs text-brand-700 hover:underline" target="_blank" rel="noreferrer">
                        เปิดรูป
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <HandoffPanel house={selected} onDone={reload} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-slate-900">รูปความคืบหน้าล่าสุด</h2>
          {photos.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีรูปที่บันทึกในแอป เพิ่มได้ที่คิวช่าง</p>}
          <ul className="space-y-2 text-sm">
            {photos.map((item) => (
              <li key={item.id}>
                {item.note || "ความคืบหน้า"} · {item.craftsman || "ไม่ระบุช่าง"}
                {item.photoUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a className="text-brand-700 hover:underline" href={item.photoUrl} target="_blank" rel="noreferrer">
                      ดูรูป
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-slate-900">ประวัติการส่งต่อ</h2>
          <RecentHandoffs view={view} unit="construction" />
        </section>
      </div>
    </div>
  );
}
