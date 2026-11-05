"use client";

import { useState } from "react";
import type { OpsView, StockMoveType } from "@/lib/ops";
import { recordMovement } from "@/lib/opsStore";
import { Btn, Select, TextInput } from "./ui";

const TYPES: StockMoveType[] = ["รับเข้า", "เบิกออก", "ย้ายคลัง", "คืน", "เคลม"];

export function MovementForm({
  view,
  onDone,
  houseId = "",
}: {
  view: OpsView;
  onDone: () => void;
  houseId?: string;
}) {
  const [type, setType] = useState<StockMoveType>("เบิกออก");
  const [materialId, setMaterialId] = useState(view.materials[0]?.id || "");
  const [qty, setQty] = useState("1");
  const [from, setFrom] = useState("คลังกลาง");
  const [to, setTo] = useState("คลังกลาง");
  const [linkedHouse, setLinkedHouse] = useState(houseId);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = recordMovement({
      type,
      materialId,
      qty: Number(qty),
      from: type === "รับเข้า" ? "" : from,
      to: type === "เบิกออก" || type === "เคลม" ? "" : to,
      houseId: linkedHouse,
      note,
      photoUrl: "",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setNote("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <label className="text-xs text-slate-500">
        ประเภท
        <Select className="mt-1" value={type} onChange={(event) => setType(event.target.value as StockMoveType)}>
          {TYPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </label>
      <label className="text-xs text-slate-500">
        วัสดุ
        <Select className="mt-1" value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
          {view.materials.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.name} (คงเหลือ {item.onHand})
            </option>
          ))}
        </Select>
      </label>
      <label className="text-xs text-slate-500">
        จำนวน
        <TextInput className="mt-1" type="number" min="0" step="0.01" value={qty} onChange={(event) => setQty(event.target.value)} />
      </label>
      <label className="text-xs text-slate-500">
        บ้านที่ผูกต้นทุน
        <Select className="mt-1" value={linkedHouse} onChange={(event) => setLinkedHouse(event.target.value)}>
          <option value="">ไม่ผูกบ้าน</option>
          {view.houses.map((house) => (
            <option key={house.id} value={house.id}>
              {house.label}
            </option>
          ))}
        </Select>
      </label>
      {type !== "รับเข้า" && (
        <label className="text-xs text-slate-500">
          คลังต้นทาง
          <Select className="mt-1" value={from} onChange={(event) => setFrom(event.target.value)}>
            {view.locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </Select>
        </label>
      )}
      {type !== "เบิกออก" && type !== "เคลม" && (
        <label className="text-xs text-slate-500">
          คลังปลายทาง
          <Select className="mt-1" value={to} onChange={(event) => setTo(event.target.value)}>
            {view.locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </Select>
        </label>
      )}
      <label className="text-xs text-slate-500 md:col-span-2">
        หมายเหตุ
        <TextInput className="mt-1" value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น เบิกติดบ้าน / คืนของเสีย / เคลมร้าน" />
      </label>
      {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <Btn type="submit">บันทึกเคลื่อนไหว</Btn>
      </div>
    </form>
  );
}
