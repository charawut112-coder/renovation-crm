"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ChecklistPanel from "@/components/ChecklistPanel";
import QcPanel from "@/components/QcPanel";
import LateBadge from "@/components/LateBadge";
import StatusChanger from "@/components/StatusChanger";
import { STATUS_COLORS, formatPrice, loadProperties, type Property } from "@/lib/data";
import { STATUS_CHECKLIST, loadLogs, type StatusLog } from "@/lib/checklist";
import { loadCustomers, type Customer } from "@/lib/customers";
import { loadMedia, removeMedia, type MediaFile } from "@/lib/media";
import type { ChangeStatusResult } from "@/lib/pipeline";
import {
  analyzeTimeline,
  formatDate,
  formatDateTime,
  getPropertyTimeline,
  stageTimingLabel,
  updateStageDate,
  type TimelineAnalysis,
} from "@/lib/timeline";
import { TICKET_STATUS_LABEL, loadFollowups, loadTickets, loadWarranties, type AfterSalesTicket, type FollowupItem, type Warranty } from "@/lib/aftersales";
import { referralsForCustomer } from "@/lib/referrals";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [property, setProperty] = useState<Property | null>(null);
  const [missing, setMissing] = useState(false);
  const [timing, setTiming] = useState<TimelineAnalysis | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  function refresh() {
    const found = loadProperties().find((p) => p.id === id) || null;
    setProperty(found);
    setMissing(!found);
    if (found) {
      setTiming(analyzeTimeline(getPropertyTimeline(found), found.status));
    } else {
      setTiming(null);
    }
    setLogs(loadLogs().filter((l) => l.propertyId === id));
    setCustomers(loadCustomers());
    setFiles(loadMedia().filter((f) => f.propertyId === id));
    setWarranties(loadWarranties().filter((w) => w.propertyId === id));
    setTickets(loadTickets().filter((t) => t.propertyId === id));
    setFollowups(loadFollowups().filter((f) => f.propertyId === id));
    const ownerId = found?.customerId;
    setReferralCount(ownerId ? referralsForCustomer(ownerId).length : 0);
    setReloadToken((n) => n + 1);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function onResult(result: ChangeStatusResult) {
    if (!result.ok) setBanner(result.error);
    else if (result.changed) setBanner(null);
  }

  if (!property || !timing) {
    return (
      <div className="p-8">
        <Link href="/properties" className="text-sm text-brand-600 hover:underline">
          ← บ้านทั้งหมด
        </Link>
        <p className="mt-6 text-slate-500">{missing ? "ไม่พบบ้านหลังนี้" : "กำลังโหลด..."}</p>
      </div>
    );
  }

  const primary = customers.find((c) => c.id === property.customerId);
  const displayName = primary?.fullName || property.customerName || "ยังไม่ระบุลูกค้า";
  const interested = customers.filter(
    (c) => c.interestedPropertyCode === property.code && c.id !== property.customerId
  );

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <Link href="/properties" className="text-sm text-brand-600 hover:underline">
          ← บ้านทั้งหมด
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{property.code}</h1>
              <LateBadge late={timing.late} title="มีขั้นที่วันจริงช้ากว่าแผน หรือยังไม่จบทั้งที่แผนผ่านมาแล้ว" />
              <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[property.status]}`}>
                {property.status}
              </span>
            </div>
            <p className="text-slate-600 mt-1">
              {property.address} · {property.district}
            </p>
          </div>
          <StatusChanger
            propertyId={property.id}
            status={property.status}
            size="md"
            onChanged={refresh}
            onResult={onResult}
          />
        </div>
      </div>

      {banner && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{banner}</div>
      )}

      <div className="grid md:grid-cols-4 gap-3">
        <Info label="ต้นทุนซื้อ" value={formatPrice(property.purchasePrice)} />
        <Info label="ราคาขาย" value={property.salePrice ? formatPrice(property.salePrice) : "—"} />
        <Info label="ความคืบหน้าจริง" value={`${timing.progress}% · ${timing.doneCount}/${timing.total} ขั้น`} />
        <Info label="ตามแผนถึงวันนี้" value={`${timing.expectedProgress}% · ${timing.expectedCount}/${timing.total} ขั้น`} />
      </div>

      {property.notes && (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-3">
          บันทึก: {property.notes}
        </p>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">ลูกค้า</h2>
        {primary ? (
          <Link href={`/customers/${primary.id}`} className="block hover:bg-slate-50 rounded-lg -mx-2 px-2 py-1">
            <div className="font-medium text-brand-600">{primary.fullName}</div>
            <div className="text-sm text-slate-500">
              {primary.phone || "ไม่มีเบอร์"} · {primary.source} · {primary.leadScore}
            </div>
          </Link>
        ) : (
          <p className="text-sm text-slate-600">{displayName}</p>
        )}
        {interested.length > 0 && (
          <div className="mt-3 text-sm text-slate-600">
            <div className="text-xs text-slate-400 mb-1">ลีดที่สนใจบ้านนี้</div>
            <ul className="space-y-1">
              {interested.map((c) => (
                <li key={c.id}>
                  <Link href={`/customers/${c.id}`} className="text-brand-600 hover:underline">
                    {c.fullName}
                  </Link>
                  <span className="text-slate-400"> · {c.leadScore}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!primary && interested.length === 0 && (
          <p className="text-xs text-slate-400 mt-1">ยังไม่มีลูกค้าผูกกับบ้านนี้ — บันทึกจาก Lead Agent ได้</p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800">แผน vs จริง</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          ความคืบหน้าคิดจากจำนวนขั้นที่มีวันที่จริงเทียบ {timing.total} ขั้น ไม่ได้คิดจากลำดับสถานะอย่างเดียว
          ล่าช้าเมื่อวันจริงเกินแผน หรือขั้นที่ถึงแล้วแต่แผนผ่านไปโดยยังไม่จบ
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-slate-500 text-xs">
              <tr>
                <th className="text-left font-medium py-2">สถานะ</th>
                <th className="text-left font-medium py-2">วันแผน</th>
                <th className="text-left font-medium py-2">วันจริง</th>
                <th className="text-left font-medium py-2">ผลเทียบแผน</th>
              </tr>
            </thead>
            <tbody>
              {timing.stages.map((stage) => (
                <tr
                  key={stage.status}
                  className={`border-t border-slate-100 ${stage.phase === "current" ? "bg-brand-50" : ""}`}
                >
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-800">{stage.status}</div>
                    {stage.phase === "current" && <div className="text-[10px] text-brand-600">สถานะปัจจุบัน</div>}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="date"
                      value={stage.plannedDate}
                      className="border border-slate-200 rounded px-2 py-1 text-xs"
                      onChange={(e) => {
                        if (!e.target.value) return;
                        updateStageDate(property.id, stage.status, { plannedDate: e.target.value });
                        refresh();
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="date"
                      value={stage.actualDate || ""}
                      className="border border-slate-200 rounded px-2 py-1 text-xs"
                      onChange={(e) => {
                        updateStageDate(property.id, stage.status, {
                          actualDate: e.target.value || null,
                        });
                        refresh();
                      }}
                    />
                  </td>
                  <td className="py-2">
                    <span className={stage.late ? "text-red-600 font-medium" : "text-slate-600"}>
                      {stageTimingLabel(stage)}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      แผน {formatDate(stage.plannedDate)}
                      {stage.actualDate ? ` · จริง ${formatDate(stage.actualDate)}` : ""}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="checklist" className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-1">Checklist · {property.status}</h2>
        <p className="text-xs text-slate-500 mb-3">ต้องครบก่อนเลื่อนไปขั้นถัดไป</p>
        <ChecklistPanel
          propertyId={property.id}
          status={property.status}
          reloadToken={reloadToken}
          onChange={refresh}
        />
      </section>

      {!(STATUS_CHECKLIST[property.status] || []).includes("Checklist QC") && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-1">ผลตรวจ QC</h2>
          <p className="text-xs text-slate-500 mb-3">ใช้ตอนสถานะตรวจงานก่อนนำขาย และยังเปิดดูย้อนหลังได้</p>
          <QcPanel propertyId={property.id} reloadToken={reloadToken} onChange={refresh} />
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">ไฟล์ของบ้านนี้</h2>
        {files.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีไฟล์ — แนบจาก checklist ด้านบน</p>}
        <ul className="grid sm:grid-cols-2 gap-3">
          {files.map((f) => (
            <li key={f.id} className="border border-slate-100 rounded-lg p-3 flex gap-3">
              {f.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.dataUrl} alt={f.name} className="h-16 w-16 rounded object-cover border border-slate-200" />
              ) : (
                <div className="h-16 w-16 rounded bg-slate-100 text-[10px] text-slate-500 flex items-center justify-center text-center px-1">
                  {f.kind}
                </div>
              )}
              <div className="min-w-0 text-sm">
                <a href={f.dataUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate block">
                  {f.name}
                </a>
                <div className="text-xs text-slate-400 mt-0.5">
                  {f.checklistItemKey} · {f.kind} · {formatDateTime(f.createdAt)}
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline mt-1"
                  onClick={() => {
                    removeMedia(f.id);
                    refresh();
                  }}
                >
                  ลบไฟล์
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 text-sm space-y-3">
        <h2 className="font-semibold text-slate-800">หลังการขายของบ้านนี้</h2>
        {warranties.length === 0 && tickets.length === 0 && followups.length === 0 && (
          <p className="text-slate-400">ยังไม่มีแพ็กเกจ — จะถูกสร้างเมื่อสถานะเข้าสู่ส่งมอบหรือหลังการขาย</p>
        )}
        {warranties.length > 0 && (
          <ul className="space-y-1 text-slate-600">
            {warranties.map((item) => (
              <li key={item.id}>
                รับประกัน{item.category} ถึง {item.endDate} · {item.status}
              </li>
            ))}
          </ul>
        )}
        {followups.length > 0 && (
          <ul className="space-y-1 text-slate-600">
            {followups.map((item) => (
              <li key={item.id}>
                {item.label} · {item.dueDate} {item.done ? "· ส่ง LINE แล้ว" : "· รอส่ง"}
              </li>
            ))}
          </ul>
        )}
        {tickets.length > 0 && (
          <ul className="space-y-1 text-slate-600">
            {tickets.map((item) => (
              <li key={item.id}>
                {item.title} · {TICKET_STATUS_LABEL[item.status]}
                {item.assignedTo ? ` · ${item.assignedTo}` : ""}
              </li>
            ))}
          </ul>
        )}
        {referralCount > 0 && (
          <p className="text-slate-600">การแนะนำของลูกค้านี้ {referralCount} รายการ</p>
        )}
        <Link href="/after-sales" className="text-brand-600 text-xs hover:underline">
          เปิดหน้าระบบหลังการขาย
        </Link>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">ประวัติสถานะ</h2>
        {logs.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีประวัติ</p>}
        <ul className="divide-y divide-slate-100">
          {logs.map((log) => (
            <li key={log.id} className="py-3 text-sm">
              <div className="text-slate-800">
                {log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatDateTime(log.createdAt)} · {log.changedBy}
                {(log.reason || log.note) && ` · ${log.reason || log.note}`}
              </div>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
