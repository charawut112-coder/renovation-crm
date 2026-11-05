"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "./useOps";
import { Btn, Empty, Pill, Select, TextInput } from "./ui";
import { addSchedule, loadOpsView, updateTicket } from "@/lib/opsStore";
import type { TicketView } from "@/lib/ops";

export default function FieldServicePanel() {
  const { view, reload } = useOps();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"open" | "late" | "all">("open");
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!view) return [];
    return view.tickets.filter((ticket) => {
      if (filter === "open" && ticket.closed) return false;
      if (filter === "late" && !ticket.late) return false;
      const blob = `${ticket.project} ${ticket.houseNo} ${ticket.problem} ${ticket.craftsman} ${ticket.status}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [view, q, filter]);

  if (!view) return <p className="text-sm text-slate-500">กำลังโหลดแจ้งซ่อมจาก snapshot…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <TextInput className="max-w-xs" placeholder="ค้นหาบ้าน ปัญหา หรือช่าง" value={q} onChange={(event) => setQ(event.target.value)} />
        {(
          [
            ["open", "ยังไม่ปิด"],
            ["late", "ล่าช้า"],
            ["all", "ทั้งหมด"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`text-xs rounded-full px-3 py-1 border ${filter === id ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200"}`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-slate-500">
          เปิดอยู่ {view.openTickets.length} / ทั้งหมด {view.tickets.length} · วันที่ในชีตว่าง จึงใช้สถานะเป็นหลัก
        </span>
      </div>
      {rows.length === 0 && <Empty title="ไม่พบรายการตามตัวกรอง">ลองสลับเป็น «ทั้งหมด» หรือล้างคำค้น</Empty>}
      <div className="space-y-3">
        {rows.map((ticket) => (
          <article key={ticket.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-slate-800">
                  {ticket.houseId ? (
                    <Link href={`/houses/${ticket.houseId}`} className="text-brand-600 hover:underline">
                      {ticket.project} {ticket.houseNo}
                    </Link>
                  ) : (
                    `${ticket.project} ${ticket.houseNo}`
                  )}
                  {ticket.soi ? <span className="text-slate-400 font-normal"> · {ticket.soi}</span> : null}
                </div>
                <p className="text-sm text-slate-700 mt-1">{ticket.problem || "ไม่ระบุปัญหา"}</p>
                {ticket.note && <p className="text-xs text-slate-500 mt-1">หมายเหตุ: {ticket.note}</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Pill tone={ticket.closed ? "green" : ticket.late ? "red" : "amber"}>{ticket.status}</Pill>
                {ticket.closeConfirmed && <Pill tone="green">ยืนยันปิดแล้ว</Pill>}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ช่าง {ticket.craftsman || "ยังไม่ระบุ"}
              {ticket.time ? ` · เวลาในชีต ${ticket.time}` : ""}
              {ticket.date ? ` · นัด ${ticket.date}` : ""}
            </p>
            <button type="button" className="text-xs text-brand-600 mt-2 hover:underline" onClick={() => setActive(active === ticket.id ? null : ticket.id)}>
              {active === ticket.id ? "ซ่อนการจัดการ" : "นัดช่าง / หลักฐาน / ปิดงาน"}
            </button>
            {active === ticket.id && (
              <TicketActions
                ticket={ticket}
                craftsmen={view.craftsmanNames}
                error={error}
                onError={setError}
                onDone={() => {
                  setError(null);
                  reload();
                }}
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function TicketActions({
  ticket,
  craftsmen,
  error,
  onError,
  onDone,
}: {
  ticket: TicketView;
  craftsmen: string[];
  error: string | null;
  onError: (value: string | null) => void;
  onDone: () => void;
}) {
  const [craftsman, setCraftsman] = useState(ticket.craftsman);
  const [date, setDate] = useState(ticket.date);
  const [time, setTime] = useState(ticket.time);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [closeNote, setCloseNote] = useState(ticket.closeNote);
  const [confirmed, setConfirmed] = useState(false);

  function schedule() {
    const when = [date, time].filter(Boolean).join(" ");
    if (!craftsman || !when) {
      onError("ระบุช่าง และวันหรือเวลา");
      return;
    }
    const current = loadOpsView();
    const clash = current.appointments.some(
      (item) => item.id !== ticket.id && item.craftsman === craftsman && item.when === when
    );
    if (clash && !allowOverlap) {
      onError("เวลานี้ซ้อนกับงานของช่างคนเดียวกัน — ติ๊กยืนยันถ้าต้องการบันทึกต่อ");
      return;
    }
    updateTicket(ticket.id, { craftsman, date, time, status: ticket.closed ? ticket.status : "กำลังดำเนินการ" });
    addSchedule({ craftsman, date, time, houseId: ticket.houseId, ticketId: ticket.id, note: ticket.problem || "นัดซ่อม" });
    onError(null);
    onDone();
  }

  function addEvidence() {
    if (!evidenceUrl.trim()) {
      onError("ใส่ลิงก์รูปหลักฐาน");
      return;
    }
    updateTicket(ticket.id, {
      evidence: { id: `ev-${Date.now()}`, name: evidenceName || "หลักฐาน", url: evidenceUrl.trim(), kind: "หลักฐาน" },
    });
    setEvidenceUrl("");
    setEvidenceName("");
    onError(null);
    onDone();
  }

  function closeJob() {
    if (!confirmed) {
      onError("ติ๊กยืนยันปิดงานก่อนบันทึก");
      return;
    }
    updateTicket(ticket.id, { closeConfirmed: true, closeNote, status: "เสร็จสิ้น" });
    onError(null);
    onDone();
  }

  return (
    <div className="mt-3 grid lg:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">นัดช่าง</p>
        <Select value={craftsman} onChange={(event) => setCraftsman(event.target.value)}>
          <option value="">เลือกช่าง</option>
          {craftsmen.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </Select>
        <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <TextInput value={time} onChange={(event) => setTime(event.target.value)} placeholder="เวลา เช่น 13:00 - 17:00" />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={allowOverlap} onChange={(event) => setAllowOverlap(event.target.checked)} />
          บันทึกแม้เวลาซ้อน
        </label>
        <Btn type="button" onClick={schedule}>
          บันทึกนัด
        </Btn>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">หลักฐาน</p>
        {ticket.evidence.length === 0 && <p className="text-xs text-slate-400">ยังไม่มีไฟล์ — ใส่ URL รูปหรือโฟลเดอร์</p>}
        <ul className="text-xs space-y-1">
          {ticket.evidence.map((file) => (
            <li key={file.id}>
              <a href={file.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                {file.name}
              </a>
            </li>
          ))}
        </ul>
        <TextInput value={evidenceName} onChange={(event) => setEvidenceName(event.target.value)} placeholder="ชื่อไฟล์" />
        <TextInput value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://…" />
        <Btn type="button" tone="ghost" onClick={addEvidence}>
          แนบหลักฐาน
        </Btn>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">ปิดงาน</p>
        <TextInput value={closeNote} onChange={(event) => setCloseNote(event.target.value)} placeholder="สิ่งที่ยืนยันกับลูกค้า" />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          ยืนยันปิดงานกับลูกค้าแล้ว
        </label>
        <Btn type="button" onClick={closeJob} disabled={ticket.closeConfirmed}>
          {ticket.closeConfirmed ? "ปิดแล้ว" : "ปิดงาน"}
        </Btn>
      </div>
      {error && <p className="text-sm text-red-600 lg:col-span-3">{error}</p>}
    </div>
  );
}
