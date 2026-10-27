"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { Btn, Empty, PageHead, Pill, Select, TextInput } from "@/components/ops/ui";
import { addProgress, addSchedule } from "@/lib/opsStore";
import { formatIsoDate } from "@/lib/format";

export default function CraftsmenPage() {
  const { view, reload } = useOps();
  const [craftsman, setCraftsman] = useState("");
  const [houseId, setHouseId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [progressNote, setProgressNote] = useState("");

  const selected = craftsman || view?.craftsmanNames[0] || "";

  const bundle = useMemo(() => {
    if (!view) return null;
    const houses = view.houses.filter((house) => house.craftsman === selected && house.source === "สถานะบ้าน");
    const active = houses.filter((house) => house.houseStatus === "กำลังดำเนินงาน");
    const tickets = view.openTickets.filter((ticket) => ticket.craftsman === selected);
    const design = view.designJobs.filter((job) => job.owner === selected && job.phase !== "อนุมัติ" && job.phase !== "ไม่ออกแบบ");
    const overlaps = view.overlaps.filter((group) => group.craftsman === selected);
    const progress = view.houses.flatMap((house) => house.progress).filter((item) => item.craftsman === selected);
    return { houses, active, tickets, design, overlaps, progress };
  }, [view, selected]);

  if (!view || !bundle) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดคิวช่าง…</div>;

  function saveSchedule() {
    const when = [date, time].filter(Boolean).join(" ");
    if (!selected || !when) {
      setError("เลือกช่าง และใส่วันหรือเวลา");
      return;
    }
    const clash = view!.appointments.some((item) => item.craftsman === selected && item.when === when);
    if (clash && !allowOverlap) {
      setError("ช่วงนี้ซ้อนกับงานที่มีอยู่ — ติ๊กยืนยันถ้าจะบันทึกต่อ");
      return;
    }
    addSchedule({ craftsman: selected, date, time, houseId, ticketId: "", note: note || "นัดหน้างาน" });
    setError(null);
    setNote("");
    reload();
  }

  function saveProgress() {
    if (!houseId) {
      setError("เลือกบ้านก่อนบันทึกความคืบหน้า");
      return;
    }
    addProgress({
      houseId,
      craftsman: selected,
      note: progressNote || "อัปเดตหน้างาน",
      percent: null,
      photoUrl: photoUrl.trim(),
      photoName: photoUrl ? "รูปความคืบหน้า" : "",
    });
    setProgressNote("");
    setPhotoUrl("");
    setError(null);
    reload();
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-4">
      <PageHead
        title="คิวช่าง"
        subtitle="จัดคิวจากบ้านที่กำลังทำ งานออกแบบที่ยังไม่จบ และแจ้งซ่อมที่ยังเปิด ระบบเตือนเมื่อช่างคนเดียวกันมีเวลานัดซ้ำ"
      />

      {view.overlaps.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800 mb-2">พบเวลาซ้อน {view.overlaps.length} ช่วง</h2>
          <ul className="text-sm text-red-900 space-y-1">
            {view.overlaps.map((group) => (
              <li key={`${group.craftsman}-${group.when}`}>
                {group.craftsman} · {group.when} · {group.items.map((item) => `${item.houseLabel} (${item.label})`).join(" / ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {view.craftsmanNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCraftsman(name)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm border ${selected === name ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200"}`}
          >
            {name}
          </button>
        ))}
      </div>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold mb-2">บ้านที่รับผิดชอบ</h2>
          {bundle.houses.length === 0 && <p className="text-sm text-slate-500">ไม่มีบ้านในชีตสถานะบ้าน</p>}
          <ul className="space-y-2 text-sm">
            {bundle.houses.map((house) => (
              <li key={house.id}>
                <Link href={`/houses/${house.id}`} className="text-brand-600 hover:underline">
                  {house.project} {house.houseNo}
                </Link>
                <div className="text-xs text-slate-500">
                  {house.houseStatus} · {house.step}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-2">กำลังดำเนินงาน {bundle.active.length} หลัง</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold mb-2">แจ้งซ่อมที่เปิด</h2>
          {bundle.tickets.length === 0 && <p className="text-sm text-slate-500">ไม่มีคิวซ่อม</p>}
          <ul className="space-y-2 text-sm">
            {bundle.tickets.map((ticket) => (
              <li key={ticket.id}>
                {ticket.project} {ticket.houseNo}
                <div className="text-xs text-slate-500">
                  {ticket.status} {ticket.time ? `· ${ticket.time}` : ""} {ticket.problem}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold mb-2">แบบที่ยังไม่จบ</h2>
          {bundle.design.length === 0 && <p className="text-sm text-slate-500">ไม่มีแบบค้าง</p>}
          <ul className="space-y-2 text-sm">
            {bundle.design.map((job) => (
              <li key={job.id}>
                {job.project} {job.houseNo} · {job.phase}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">จัดคิว</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <Select value={houseId} onChange={(event) => setHouseId(event.target.value)}>
            <option value="">เลือกบ้าน</option>
            {view.houses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.label}
              </option>
            ))}
          </Select>
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <TextInput value={time} onChange={(event) => setTime(event.target.value)} placeholder="เวลา เช่น 09:30" />
          <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="งานที่นัด" />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={allowOverlap} onChange={(event) => setAllowOverlap(event.target.checked)} />
          บันทึกแม้ตรวจแล้วเวลาซ้อน
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Btn type="button" onClick={saveSchedule}>
          บันทึกคิว
        </Btn>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">ความคืบหน้าและรูป</h2>
        <p className="text-xs text-slate-500">ใส่ลิงก์รูป หรือปล่อยว่างถ้ายังไม่มีไฟล์ อัปโหลดจริงยังไม่ต่อที่เก็บภายนอกในรอบนี้</p>
        <TextInput value={progressNote} onChange={(event) => setProgressNote(event.target.value)} placeholder="บันทึกหน้างาน" />
        <TextInput value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="ลิงก์รูปความคืบหน้า" />
        <Btn type="button" tone="ghost" onClick={saveProgress}>
          บันทึกความคืบหน้า
        </Btn>
        {bundle.progress.length === 0 && <Empty title="ยังไม่มีความคืบหน้าที่บันทึกให้ช่างคนนี้" />}
        <ul className="space-y-2">
          {bundle.progress.map((item) => {
            const house = view.houses.find((row) => row.id === item.houseId);
            return (
              <li key={item.id} className="text-sm border border-slate-100 rounded-lg p-3">
                <div className="font-medium">{house?.label || item.houseId}</div>
                <div className="text-slate-600">{item.note}</div>
                <div className="text-[11px] text-slate-400">{formatIsoDate(item.at.slice(0, 10))}</div>
                {item.photoUrl && (
                  <a href={item.photoUrl} target="_blank" rel="noreferrer" className="text-brand-600 text-xs hover:underline">
                    {item.photoName || "เปิดรูป"}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-2">
          {bundle.design
            .filter((job) => job.attachments.length)
            .map((job) => (
              <span key={job.id}>
                {job.attachments.map((file) => (
                  <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline mr-3">
                    รูปอ้างอิง {job.houseNo}
                  </a>
                ))}
              </span>
            ))}
        </div>
        {bundle.overlaps.length > 0 && <Pill tone="red">ช่างคนนี้มีเวลาซ้อน</Pill>}
      </section>
    </div>
  );
}
