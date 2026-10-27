"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MovementForm } from "@/components/ops/MovementForm";
import { StepEditor } from "@/components/ops/StepEditor";
import { useOps } from "@/components/ops/useOps";
import { Btn, Empty, Pill, TextInput } from "@/components/ops/ui";
import { formatIsoDate, formatMoney, formatQty } from "@/lib/format";
import { addHouseDoc } from "@/lib/opsStore";

export default function HouseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const { view, reload } = useOps();
  const [docUrl, setDocUrl] = useState("");
  const [docSlot, setDocSlot] = useState("contract");
  const house = view?.houses.find((item) => item.id === id);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลด…</div>;
  if (!house) {
    return (
      <div className="p-4 sm:p-8">
        <Link href="/houses" className="text-sm text-brand-600">
          ← ลูกค้าและบ้าน
        </Link>
        <p className="mt-4 text-slate-500">ไม่พบบ้านนี้ใน snapshot</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-5">
      <Link href="/houses" className="text-sm text-brand-600 hover:underline">
        ← ลูกค้าและบ้าน
      </Link>
      <header>
        <p className="text-xs text-slate-500">กลุ่มลูกค้า · {house.project}</p>
        <h1 className="text-2xl font-bold text-slate-800">
          {house.houseNo}
          {house.soi ? <span className="text-slate-500 font-medium"> · {house.soi}</span> : null}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Pill tone="blue">{house.houseStatus}</Pill>
          <Pill>{house.step}</Pill>
          {house.late && <Pill tone="red">ล่าช้า</Pill>}
          {house.duplicate && <Pill tone="amber">แถวซ้ำในชีตสถานะบ้าน</Pill>}
        </div>
      </header>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">ข้อมูลบ้าน</h2>
        <dl className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>ประเภท: {house.type || "ไม่ระบุในชีต"}</div>
          <div>ช่าง: {house.craftsman || "ไม่ระบุ"}</div>
          <div>ป้าย: {house.signStatus || "ไม่ระบุ"}</div>
          <div>ของเข้าหน้างาน: {house.siteStatus || "ไม่มีแถวในชีต"}</div>
          <div>ที่มาข้อมูล: {house.source}</div>
          <div>ต้นทุนที่ผูกแล้ว: {formatMoney(house.totalCost)}</div>
        </dl>
        {house.note && <p className="text-sm text-slate-500 mt-2">{house.note}</p>}
        {house.lateReasons.length > 0 && (
          <ul className="mt-3 text-sm text-red-700 list-disc pl-5">
            {house.lateReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-semibold mb-1">สถานะงานรายขั้น</h2>
        <p className="text-xs text-slate-500 mb-3">ผู้รับผิดชอบและกำหนดส่งแก้ได้ ย้อนขั้นต้องใส่เหตุผล งานถือว่าล่าช้าเมื่อวันกำหนดของขั้นปัจจุบันผ่านไปแล้ว</p>
        <StepEditor house={house} onChange={reload} />
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">ประวัติ</h2>
        {house.history.length === 0 && <Empty title="ยังไม่มีประวัติ" />}
        <ol className="space-y-3">
          {house.history.map((event) => (
            <li key={event.id} className="text-sm border-l-2 border-brand-100 pl-3">
              <div className="font-medium text-slate-800">{event.title}</div>
              <div className="text-slate-600">{event.detail}</div>
              <div className="text-[11px] text-slate-400">{event.at ? formatIsoDate(event.at) : "ไม่ระบุวันที่ในชีต"}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">ข้อตกลงและเอกสาร</h2>
        <p className="text-xs text-slate-500 mb-3">snapshot ไม่มีไฟล์สัญญา ช่องด้านล่างเป็นที่เก็บลิงก์เมื่อทีมอัปโหลดภายหลัง</p>
        <ul className="space-y-2 mb-3">
          {house.docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2">
              <div>
                <div className="font-medium">{doc.name}</div>
                <div className="text-xs text-slate-500">{doc.file ? "มีไฟล์แนบ" : doc.hint}</div>
              </div>
              {doc.file ? (
                <a href={doc.file.url} target="_blank" rel="noreferrer" className="text-brand-600 text-xs hover:underline">
                  เปิด {doc.file.name}
                </a>
              ) : (
                <Pill>ยังไม่มีไฟล์</Pill>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={docSlot} onChange={(event) => setDocSlot(event.target.value)}>
            {house.docs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
          <TextInput className="max-w-sm" placeholder="ลิงก์เอกสาร" value={docUrl} onChange={(event) => setDocUrl(event.target.value)} />
          <Btn
            type="button"
            onClick={() => {
              if (!docUrl.trim()) return;
              const slot = house.docs.find((doc) => doc.id === docSlot);
              addHouseDoc(house.id, {
                id: docSlot,
                name: slot?.name || "เอกสาร",
                url: docUrl.trim(),
                kind: "เอกสาร",
              });
              setDocUrl("");
              reload();
            }}
          >
            แนบลิงก์
          </Btn>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">วัสดุและต้นทุนของบ้านนี้</h2>
        {house.purchaseLines.length === 0 && house.stockCost === 0 && (
          <Empty title="ยังไม่มีต้นทุนผูกกับบ้านนี้">
            ใบสั่งในชีตไม่มีราคา และยังไม่มีการเบิกสต็อก กรอกราคาในหน้าสต็อกหรือเบิกวัสดุด้านล่าง ระบบจะคิดจากราคาต่อหน่วยในคลัง
          </Empty>
        )}
        {house.purchaseLines.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-2">ใบสั่ง</th>
                  <th className="text-left">รายการ</th>
                  <th className="text-right">จำนวน</th>
                  <th className="text-left">สถานะ</th>
                  <th className="text-right">ต้นทุน</th>
                </tr>
              </thead>
              <tbody>
                {house.purchaseLines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100">
                    <td className="py-2">{line.poNumber}</td>
                    <td>
                      {line.item} <span className="text-slate-400">{line.vendor}</span>
                    </td>
                    <td className="text-right">
                      {formatQty(line.qty)} {line.unit}
                    </td>
                    <td>{line.status}</td>
                    <td className="text-right">{line.lineCost == null ? "ยังไม่มีราคาในชีต" : formatMoney(line.lineCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-slate-600">
          เบิก/คืนสต็อก {formatMoney(house.stockCost)} · ใบสั่งที่ระบุราคา {formatMoney(house.poCost)} · รวม {formatMoney(house.totalCost)}
        </p>
        <MovementForm view={view} houseId={house.id} onDone={reload} />
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-semibold mb-2">After-Sales ของบ้านนี้</h2>
        {house.tickets.length === 0 && <Empty title="ไม่มีแจ้งซ่อมในชีต" />}
        <ul className="space-y-2">
          {house.tickets.map((ticket) => (
            <li key={ticket.id} className="text-sm border border-slate-100 rounded-lg p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Pill tone={ticket.closed ? "green" : "amber"}>{ticket.status}</Pill>
                <span>{ticket.problem || "ไม่ระบุปัญหา"}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {ticket.craftsman || "ไม่มีช่าง"} {ticket.time ? `· ${ticket.time}` : ""} {ticket.note ? `· ${ticket.note}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <Link href="/after-sales" className="inline-block mt-3 text-sm text-brand-600 hover:underline">
          จัดการนัด หลักฐาน และปิดงาน
        </Link>
      </section>
    </div>
  );
}
