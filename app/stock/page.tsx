"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MovementForm } from "@/components/ops/MovementForm";
import { useOps } from "@/components/ops/useOps";
import { Btn, Empty, PageHead, Pill, TextInput } from "@/components/ops/ui";
import { formatMoney, formatQty } from "@/lib/format";
import { setPoPrice, setPoStatus } from "@/lib/opsStore";

type Tab = "stock" | "moves" | "po" | "cost";

export default function StockPage() {
  const { view, reload } = useOps();
  const [tab, setTab] = useState<Tab>("stock");
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const materials = useMemo(() => {
    if (!view) return [];
    return view.materials.filter((item) => {
      if (lowOnly && !item.low) return false;
      const blob = `${item.code} ${item.name} ${item.category}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [view, q, lowOnly]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดสต็อก…</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "stock", label: "สต็อก" },
    { id: "moves", label: "เคลื่อนไหว" },
    { id: "po", label: "ใบสั่งซื้อ" },
    { id: "cost", label: "ต้นทุนรายบ้าน" },
  ];

  const costRows = view.houses.filter((house) => house.isCostOwner && (house.purchaseLines.length > 0 || house.stockCost !== 0));

  return (
    <div className="p-4 sm:p-8">
      <PageHead
        title="วัสดุ สต็อก และต้นทุน"
        subtitle={`คงเหลือคำนวณจากชีตสต็อก แล้วบวกการรับเข้า เบิกออก ย้ายคลัง คืน และเคลมที่บันทึกในแอป ถึงจุดสั่งซื้อเมื่อคงเหลือ ≤ จุดสั่งซื้อ (${view.lowStock.length} รายการ)`}
      />
      <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px shrink-0 ${tab === item.id ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <TextInput className="max-w-xs" placeholder="ค้นรหัสหรือชื่อวัสดุ" value={q} onChange={(event) => setQ(event.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} />
              เฉพาะถึงจุดสั่งซื้อ
            </label>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">วัสดุ</th>
                  <th className="text-left px-4 py-3 font-medium">คงเหลือ</th>
                  <th className="text-right px-4 py-3 font-medium">จุดสั่ง</th>
                  <th className="text-right px-4 py-3 font-medium">ราคา/หน่วย</th>
                  <th className="text-right px-4 py-3 font-medium">มูลค่า</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.code} · {item.category} {item.spec ? `· ${item.spec}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {formatQty(item.onHand)} {item.unit}
                        {item.low && <Pill tone="red">ถึงจุดสั่ง</Pill>}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.locations.map((loc) => `${loc.location} ${formatQty(loc.qty)}`).join(" · ") || "ไม่มียอด"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{formatQty(item.reorderPoint)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(item.price)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(item.stockValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "moves" && (
        <div className="space-y-4">
          <MovementForm view={view} onDone={reload} />
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ประเภท</th>
                  <th className="text-left px-4 py-3 font-medium">วัสดุ</th>
                  <th className="text-right px-4 py-3 font-medium">จำนวน</th>
                  <th className="text-left px-4 py-3 font-medium">คลัง</th>
                  <th className="text-left px-4 py-3 font-medium">บ้าน</th>
                </tr>
              </thead>
              <tbody>
                {view.movements.map((move) => (
                  <tr key={move.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {move.type}
                      <div className="text-[11px] text-slate-400">{move.source}</div>
                    </td>
                    <td className="px-4 py-3">{move.materialName}</td>
                    <td className="px-4 py-3 text-right">
                      {formatQty(move.qty)} {move.unit}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {move.from || "—"} → {move.to || "—"}
                      {move.note && <div>{move.note}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {move.houseId ? (
                        <Link href={`/houses/${move.houseId}`} className="text-brand-600 hover:underline">
                          {move.houseLabel || "บ้าน"}
                        </Link>
                      ) : (
                        <span className="text-slate-400">ไม่ผูกบ้าน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "po" && (
        <div className="space-y-3">
          <Empty title="ชีตรายการสั่งวัสดุไม่มีคอลัมน์ราคา">
            สถานะและจำนวนมาจาก snapshot กรอกราคาต่อหน่วยเมื่อทราบ เพื่อให้ต้นทุนรายบ้านขยับ
          </Empty>
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ใบสั่ง</th>
                  <th className="text-left px-4 py-3 font-medium">บ้าน</th>
                  <th className="text-left px-4 py-3 font-medium">รายการ</th>
                  <th className="text-right px-4 py-3 font-medium">จำนวน</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="text-left px-4 py-3 font-medium">ราคา/หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {view.purchaseLines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {line.poNumber}
                      <div className="text-[11px] text-slate-400">{line.vendor}</div>
                    </td>
                    <td className="px-4 py-3">
                      {line.houseId ? (
                        <Link href={`/houses/${line.houseId}`} className="text-brand-600 hover:underline">
                          {line.project} {line.houseNo}
                        </Link>
                      ) : (
                        `${line.project} ${line.houseNo}`
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {line.category} · {line.item}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatQty(line.qty)} {line.unit}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="border border-slate-200 rounded px-2 py-1 text-xs"
                        value={line.status}
                        onChange={(event) => {
                          setPoStatus(line.id, event.target.value);
                          reload();
                        }}
                      >
                        {["รอสั่ง", "สั่งแล้ว", "ของเข้าแล้ว", "ยกเลิก"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={line.unitPrice ?? ""}
                        placeholder="ว่างในชีต"
                        className="w-28 border border-slate-200 rounded px-2 py-1 text-sm"
                        onBlur={(event) => {
                          const raw = event.target.value.trim();
                          setPoPrice(line.id, raw === "" ? null : Number(raw));
                          reload();
                        }}
                      />
                      <div className="text-[11px] text-slate-400 mt-1">
                        {line.lineCost == null ? "ยังไม่คิดต้นทุน" : formatMoney(line.lineCost)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cost" && (
        <div className="space-y-3">
          {costRows.length === 0 && (
            <Empty title="ยังไม่มีต้นทุนผูกบ้าน">เบิกวัสดุโดยเลือกบ้าน หรือกรอกราคาในใบสั่งซื้อ</Empty>
          )}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">บ้าน</th>
                  <th className="text-right px-4 py-3 font-medium">เบิกสต็อก</th>
                  <th className="text-right px-4 py-3 font-medium">ใบสั่งที่มีราคา</th>
                  <th className="text-right px-4 py-3 font-medium">รายการที่ยังไม่มีราคา</th>
                  <th className="text-right px-4 py-3 font-medium">รวม</th>
                </tr>
              </thead>
              <tbody>
                {costRows.map((house) => (
                  <tr key={house.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link href={`/houses/${house.id}`} className="text-brand-600 hover:underline">
                        {house.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{formatMoney(house.stockCost)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(house.poCost)}</td>
                    <td className="px-4 py-3 text-right">{house.poUnpriced}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(house.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Btn type="button" tone="ghost" onClick={() => setTab("moves")}>
            ไปบันทึกเบิกของ
          </Btn>
        </div>
      )}
    </div>
  );
}
