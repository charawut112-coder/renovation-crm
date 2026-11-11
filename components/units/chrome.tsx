"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import clsx from "clsx";
import { Btn, Empty, TextInput } from "@/components/ops/ui";
import { formatIsoDate } from "@/lib/format";
import { confirmHouseHandover, handoffHouse, setSalesCustomer, setSalesLead } from "@/lib/opsStore";
import type { HouseView, OpsView } from "@/lib/ops";
import { SALES_LEADS, UNIT_LABEL, type FlowUnit, type SalesLead, type WorkspaceUnit } from "@/lib/units";

const TONE: Record<WorkspaceUnit, { dot: string; soft: string; text: string; ring: string }> = {
  design: { dot: "bg-unit-design", soft: "bg-indigo-50", text: "text-indigo-900", ring: "ring-indigo-200" },
  construction: { dot: "bg-unit-construction", soft: "bg-orange-50", text: "text-orange-950", ring: "ring-orange-200" },
  sales: { dot: "bg-unit-sales", soft: "bg-emerald-50", text: "text-emerald-950", ring: "ring-emerald-200" },
  aftersales: { dot: "bg-unit-aftersales", soft: "bg-teal-50", text: "text-teal-950", ring: "ring-teal-200" },
  stock: { dot: "bg-unit-stock", soft: "bg-violet-50", text: "text-violet-950", ring: "ring-violet-200" },
};

export function UnitBanner({ unit, note }: { unit: WorkspaceUnit; note?: string }) {
  const tone = TONE[unit];
  return (
    <div className={clsx("mb-4 flex items-start gap-3 rounded-2xl px-4 py-3", tone.soft, tone.text)}>
      <span className={clsx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", tone.dot)} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{UNIT_LABEL[unit]}</p>
        <p className="text-sm opacity-80">{note || "บ้านทุกหลังเป็นระเบียนเดียวกัน การส่งต่อคือการเปลี่ยนหน่วยงาน"}</p>
      </div>
    </div>
  );
}

export function Kanban({
  columns,
}: {
  columns: { id: string; title: string; hint?: string; children: React.ReactNode; empty: string; isEmpty: boolean }[];
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {columns.map((column) => (
        <section
          key={column.id}
          aria-label={column.title}
          className="w-[min(100%,280px)] shrink-0 snap-start rounded-2xl bg-slate-100 p-3 sm:w-[300px]"
        >
          <header className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">{column.title}</h2>
          </header>
          {column.hint && <p className="mb-2 text-xs text-slate-500">{column.hint}</p>}
          <div className="space-y-2">
            {column.isEmpty ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-600">{column.empty}</p>
            ) : (
              column.children
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CardButton({
  pressed,
  onClick,
  title,
  meta,
  tags,
}: {
  pressed: boolean;
  onClick: () => void;
  title: string;
  meta: string;
  tags?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "w-full cursor-pointer rounded-xl border bg-white p-3 text-left transition-colors duration-150 min-h-11",
        pressed ? "border-brand-600 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{meta}</div>
      {tags && <div className="mt-2 flex flex-wrap gap-1">{tags}</div>}
    </button>
  );
}

export function UnitTimeline({ house }: { house: HouseView }) {
  return (
    <ol className="space-y-3" aria-label="ประวัติการเปลี่ยนหน่วยงาน">
      {house.unitHistory.length === 0 && (
        <li className="text-sm text-slate-600">
          ยังไม่มีการส่งต่อ บ้านนี้อยู่ที่{house.unitLabel}ตามสถานะในชีต และเห็นประวัตินี้ได้จากทุกหน่วยงาน
        </li>
      )}
      {house.unitHistory.map((move) => (
        <li key={`${move.at}-${move.to}`} className="border-l-2 border-slate-300 pl-3">
          <div className="text-sm font-medium text-slate-900">
            {UNIT_LABEL[move.from]} → {UNIT_LABEL[move.to]}
          </div>
          <div className="text-sm text-slate-600">{move.note}</div>
          <div className="text-xs text-slate-500">
            {move.by} · {move.at ? formatIsoDate(move.at.slice(0, 10)) : "ไม่ระบุวัน"}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RecentHandoffs({ view, unit }: { view: OpsView; unit?: FlowUnit }) {
  const rows = view.unitMoves
    .filter((item) => !unit || item.move.from === unit || item.move.to === unit)
    .slice(0, 6);
  if (rows.length === 0) {
    return (
      <Empty title="ยังไม่มีการส่งต่อ">
        เมื่อเงื่อนไขครบ กด «ส่งต่อไปหน่วยถัดไป» ประวัติจะโผล่ที่นี่และในหน้ารายละเอียดบ้านของทุกหน่วย
      </Empty>
    );
  }
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="text-sm">
          <Link href={`/houses/${row.houseId}`} className="font-medium text-brand-700 hover:underline">
            {row.label}
          </Link>
          <span className="text-slate-600">
            {" "}
            · {UNIT_LABEL[row.move.from]} → {UNIT_LABEL[row.move.to]}
            {row.move.note ? ` · ${row.move.note}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HandoffPanel({ house, onDone }: { house: HouseView; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const ready = Boolean(house.handoff.next) && house.handoff.blockers.length === 0;

  function send() {
    const result = handoffHouse(house.id, note);
    if (!result.ok) {
      setDone(null);
      setError(result.error);
      return;
    }
    setError(null);
    setDone(`ส่งต่อไป${result.toLabel}แล้ว`);
    setNote("");
    onDone();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="ส่งต่อไปหน่วยถัดไป">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">หน่วยงานของบ้านนี้</h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{house.unitLabel}</span>
      </div>
      {house.handoff.checks.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {house.handoff.checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-sm">
              {check.ok ? (
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
              )}
              <span className={check.ok ? "text-slate-700" : "text-red-800"}>
                {check.label}
                <span className="sr-only">{check.ok ? " ผ่าน" : " ยังไม่ผ่าน"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <UnitTimeline house={house} />
      {house.handoff.next ? (
        <div className="mt-4 space-y-2">
          <label className="block text-xs text-slate-500" htmlFor={`handoff-note-${house.id}`}>
            บันทึกการส่งต่อ
            <TextInput
              id={`handoff-note-${house.id}`}
              className="mt-1"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="เช่น แบบอนุมัติแล้ว ส่งหน้างาน"
            />
          </label>
          <Btn type="button" disabled={!ready} onClick={send}>
            ส่งต่อไป{UNIT_LABEL[house.handoff.next]}
          </Btn>
          {!ready && (
            <p role="alert" className="text-sm text-red-700">
              {house.handoff.blockers.join(" ")}
            </p>
          )}
          {done && <p className="text-sm text-emerald-800">{done}</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">หน่วยบริการหลังการขายเป็นปลายทาง ปิดงานด้วยการยืนยันในแท็บแจ้งซ่อม</p>
      )}
    </section>
  );
}

export function SalesEditor({ house, onDone }: { house: HouseView; onDone: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs text-slate-500">
        ชื่อลูกค้า
        <TextInput
          className="mt-1"
          defaultValue={house.salesCustomer}
          key={`${house.id}-${house.salesCustomer}`}
          placeholder="ชื่อลูกค้าหรือผู้สนใจ"
          onBlur={(event) => {
            setSalesCustomer(house.id, event.target.value.trim());
            onDone();
          }}
        />
      </label>
      <label className="text-xs text-slate-500">
        สถานะขาย
        <select
          className="mt-1 min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={house.salesLead}
          onChange={(event) => {
            setSalesLead(house.id, event.target.value as SalesLead);
            onDone();
          }}
        >
          {SALES_LEADS.map((lead) => (
            <option key={lead}>{lead}</option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 sm:col-span-2">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={house.handoverConfirmed}
          onChange={(event) => {
            confirmHouseHandover(house.id, event.target.checked);
            onDone();
          }}
        />
        ยืนยันว่าส่งมอบบ้านให้ลูกค้าแล้ว
      </label>
    </div>
  );
}
