"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { PageHead, Pill } from "@/components/ops/ui";
import { CardButton, HandoffPanel, Kanban, RecentHandoffs, SalesEditor, UnitBanner } from "@/components/units/chrome";
import { SALES_LEADS } from "@/lib/units";

export default function SalesPage() {
  const { view, reload } = useOps();
  const [openId, setOpenId] = useState<string | null>(null);

  const houses = useMemo(() => {
    if (!view) return [];
    return view.houses.filter((house) => house.flowUnit === "sales" && !house.duplicate);
  }, [view]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดงานขาย…</div>;

  const selected = houses.find((house) => house.id === openId) || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UnitBanner unit="sales" note="ลูกค้า ลีด ข้อตกลง และการส่งมอบของบ้านที่ก่อสร้างเสร็จแล้ว ส่งต่อไปหลังการขายเมื่อตกลงขายและยืนยันส่งมอบ" />
      <PageHead title="งานขาย" subtitle="บอร์ดนี้คือบ้านหลังเดียวกันกับหน่วยออกแบบและก่อสร้าง ลีดกับสัญญาจากเฟสก่อนเปิดจากลิงก์ด้านขวา">
        <div className="flex flex-wrap gap-2">
          <Link href="/houses" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50">
            ลูกค้าและบ้าน
          </Link>
          <Link href="/customers" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50">
            ลีด
          </Link>
          <Link href="/pipeline" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50">
            ข้อตกลง
          </Link>
          <Link href="/properties" className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50">
            ส่งมอบ
          </Link>
        </div>
      </PageHead>

      <Kanban
        columns={SALES_LEADS.map((lead) => {
          const rows = houses.filter((house) => house.salesLead === lead);
          return {
            id: lead,
            title: lead,
            isEmpty: rows.length === 0,
            empty: `ไม่มีบ้านในสถานะ${lead}`,
            children: rows.map((house) => (
              <CardButton
                key={house.id}
                pressed={openId === house.id}
                onClick={() => setOpenId(house.id)}
                title={`${house.project} ${house.houseNo}`}
                meta={house.salesCustomer || "ยังไม่ระบุชื่อลูกค้า"}
                tags={
                  <>
                    <Pill tone="green">{house.salesLead}</Pill>
                    {house.handoverConfirmed && <Pill tone="blue">ยืนยันส่งมอบ</Pill>}
                  </>
                }
              />
            )),
          };
        })}
      />

      {selected && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-slate-900">{selected.label}</h2>
              <p className="mt-1 text-sm text-slate-600">ขั้นงาน {selected.step} · สถานะบ้าน {selected.houseStatus}</p>
              <Link href={`/houses/${selected.id}`} className="mt-2 inline-block text-sm text-brand-700 hover:underline">
                เปิดข้อตกลงและเอกสารของบ้านนี้
              </Link>
            </div>
            <SalesEditor house={selected} onDone={reload} />
          </section>
          <HandoffPanel house={selected} onDone={reload} />
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">ประวัติการส่งต่อ</h2>
        <RecentHandoffs view={view} unit="sales" />
      </section>
    </div>
  );
}
