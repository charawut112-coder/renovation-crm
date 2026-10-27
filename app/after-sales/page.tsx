"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadWarranties,
  saveWarranties,
  loadTickets,
  saveTickets,
  loadFollowups,
  createAfterSalesPackage,
  completeFollowup,
  claimWarranty,
  warrantyDatePassed,
  warrantyExpiringSoon,
  isOverdue,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  TICKET_STATUS_LABEL,
  WARRANTY_POLICY,
  WARRANTY_STATUS_LABEL,
  type Warranty,
  type AfterSalesTicket,
  type FollowupItem,
  type TicketStatus,
} from "@/lib/aftersales";
import { appendContact } from "@/lib/contacts";
import { isHandoverStatus, loadProperties, resolveCustomerName } from "@/lib/data";
import LineFollowupModal from "@/components/LineFollowupModal";
import NewTicketModal, { type NewTicketInput } from "@/components/NewTicketModal";
import ReferralBoard from "@/components/ReferralBoard";
import ScheduleList from "@/components/ScheduleList";
import FieldServicePanel from "@/components/ops/FieldServicePanel";

type Tab = "field" | "warranties" | "tickets" | "followups" | "schedule" | "referrals";

export default function AfterSalesPage() {
  const [tab, setTab] = useState<Tab>("field");
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [lineTarget, setLineTarget] = useState<FollowupItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ทั้งหมด");
  const [reloadToken, setReloadToken] = useState(0);

  function refresh() {
    setWarranties(loadWarranties());
    setTickets(loadTickets());
    setFollowups(loadFollowups());
    setReloadToken((value) => value + 1);
  }

  useEffect(() => {
    refresh();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function sendFollowup(message: string) {
    if (!lineTarget) return;
    const saved = completeFollowup(lineTarget.id, message);
    if (!saved) return;
    if (saved.customerId) {
      appendContact({
        customerId: saved.customerId,
        channel: "LINE",
        summary: `Follow-up +${saved.dayOffset} วัน: ${saved.label}`,
        propertyCode: saved.propertyCode,
      });
    }
    setLineTarget(null);
    refresh();
    showToast("บันทึกข้อความ LINE แล้ว");
  }

  function updateTicketStatus(id: string, status: TicketStatus) {
    const next = tickets.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        status,
        completedAt:
          status === "done" || status === "closed"
            ? new Date().toISOString()
            : t.completedAt,
      };
    });
    setTickets(next);
    saveTickets(next);
    showToast(`อัปเดต Ticket → ${TICKET_STATUS_LABEL[status]}`);
  }

  function setNps(id: string, score: number) {
    const next = tickets.map((t) => (t.id === id ? { ...t, npsScore: score } : t));
    setTickets(next);
    saveTickets(next);
    showToast(`บันทึก NPS = ${score}`);
  }

  function createTicket(form: NewTicketInput) {
    const ticket: AfterSalesTicket = {
      id: `t-${Date.now()}`,
      propertyId: form.propertyId,
      propertyCode: form.propertyCode,
      customerName: form.customerName,
      customerId: form.customerId,
      customerPhone: form.customerPhone,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.assignedTo ? "assigned" : "open",
      underWarranty: form.underWarranty,
      warrantyCategory: form.warrantyCategory,
      assignedTo: form.assignedTo,
      scheduledDate: form.scheduledDate,
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    saveTickets(next);
    if (form.underWarranty && form.warrantyCategory && form.warrantyCategory !== "อื่นๆ") {
      claimWarranty(form.propertyId, form.warrantyCategory);
    }
    if (form.customerId) {
      appendContact({
        customerId: form.customerId,
        channel: "โน้ต",
        summary: `เปิด Ticket: ${form.title}`,
        propertyCode: form.propertyCode,
      });
    }
    setShowNewTicket(false);
    refresh();
    showToast("สร้าง Ticket แล้ว");
  }

  function markClaimed(id: string) {
    const target = warranties.find((item) => item.id === id);
    if (!target) return;
    const next = warranties.map((item) => (item.id === id ? { ...item, status: "claimed" as const } : item));
    setWarranties(next);
    saveWarranties(next);
    showToast(`บันทึกเคลม ${target.category}`);
  }

  function syncFromHandover() {
    const props = loadProperties().filter((p) => isHandoverStatus(p.status));
    let count = 0;
    let renamed = 0;
    props.forEach((p) => {
      const r = createAfterSalesPackage({
        propertyId: p.id,
        propertyCode: p.code,
        customerName: resolveCustomerName(p),
        customerId: p.customerId,
        handoverDate: new Date().toISOString(),
      });
      if (r.created) count++;
      else if (r.renamed) renamed++;
    });
    refresh();
    showToast(
      count > 0
        ? `สร้าง Warranty + Follow-up สำหรับ ${count} หลัง`
        : renamed > 0
          ? `อัปเดตชื่อลูกค้าในแพ็กเกจ ${renamed} หลัง`
          : "ไม่มีบ้านใหม่ที่ต้องสร้าง (มีแพ็กเกจอยู่แล้ว)"
    );
  }

  const expiring = warranties.filter((w) => warrantyExpiringSoon(w, 30));
  const openTickets = tickets.filter((t) => !["done", "closed"].includes(t.status));
  const pendingFollowups = followups.filter((f) => !f.done);

  const visibleWarranties =
    categoryFilter === "ทั้งหมด" ? warranties : warranties.filter((item) => item.category === categoryFilter);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "field", label: "แจ้งซ่อมหน้างาน" },
    { id: "warranties", label: "รับประกัน", count: warranties.length },
    { id: "tickets", label: "Ticket ซ่อม", count: openTickets.length },
    { id: "followups", label: "Follow-up", count: pendingFollowups.length },
    { id: "schedule", label: "ตารางนัด" },
    { id: "referrals", label: "แนะนำเพื่อน" },
  ];

  return (
    <div className="p-4 sm:p-8 relative max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">หลังการขาย</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            แจ้งซ่อมหน้างานจากชีต Aftersell นัดช่าง แนบหลักฐาน และปิดงานแบบยืนยัน — คง Warranty / Ticket / Follow-up ของเฟสก่อนไว้ด้วย
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncFromHandover} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            สร้าง Warranty จากบ้านที่ส่งมอบ
          </button>
          <button onClick={() => setShowNewTicket(true)} className="text-xs bg-brand-600 text-white rounded-lg px-3 py-1.5 hover:bg-brand-700">
            + Ticket ใหม่
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-6 z-20 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          ✓ {toast}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniCard title="รับประกันทั้งหมด" value={String(warranties.length)} />
        <MiniCard title="ใกล้หมดอายุ (30 วัน)" value={String(expiring.length)} warn={expiring.length > 0} />
        <MiniCard title="Ticket เปิดอยู่" value={String(openTickets.length)} />
        <MiniCard title="Follow-up ค้าง" value={String(pendingFollowups.length)} />
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition shrink-0 ${
              tab === t.id ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "field" && <FieldServicePanel />}

      {tab === "warranties" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-slate-100">
            {["ทั้งหมด", ...WARRANTY_POLICY.map((item) => item.category)].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  categoryFilter === category ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">บ้าน</th>
                <th className="text-left px-4 py-3">ลูกค้า</th>
                <th className="text-left px-4 py-3">หมวด</th>
                <th className="text-left px-4 py-3">เริ่ม</th>
                <th className="text-left px-4 py-3">หมดอายุ</th>
                <th className="text-left px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {visibleWarranties.map((w) => {
                const soon = warrantyExpiringSoon(w);
                const expired = w.status === "active" && warrantyDatePassed(w);
                const label = expired ? "หมดอายุ" : WARRANTY_STATUS_LABEL[w.status];
                const tone =
                  expired || w.status === "expired"
                    ? "bg-slate-100 text-slate-600"
                    : w.status === "claimed"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-700";
                const years = WARRANTY_POLICY.find((item) => item.category === w.category)?.years;
                return (
                  <tr key={w.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-brand-600">{w.propertyCode}</td>
                    <td className="px-4 py-3">
                      {w.customerId ? (
                        <Link href={`/customers/${w.customerId}`} className="text-brand-600 hover:underline">
                          {w.customerName}
                        </Link>
                      ) : (
                        w.customerName
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{w.category}{years ? ` · ${years} ปี` : ""}</div>
                      <div className="text-xs text-slate-400">{w.description}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.startDate}</td>
                    <td className="px-4 py-3">
                      <span className={soon || expired ? "text-red-600 font-medium" : ""}>{w.endDate}</span>
                      {soon && !expired && (
                        <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 rounded">ใกล้หมด</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${tone}`}>{label}</span>
                      {w.status === "active" && !expired && (
                        <button type="button" className="ml-2 text-[11px] text-brand-600 hover:underline" onClick={() => markClaimed(w.id)}>
                          บันทึกเคลม
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleWarranties.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    ยังไม่มีรายการรับประกัน — กด「สร้าง Warranty จากบ้านที่ส่งมอบ」
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            นโยบาย: {WARRANTY_POLICY.map((p) => `${p.category} ${p.years} ปี`).join(" · ")}
          </div>
        </div>
      )}

      {tab === "tickets" && (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{t.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLOR[t.priority]}`}>
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                    {t.underWarranty && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">ในประกัน</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t.propertyCode} · {t.customerName} · {t.customerPhone}
                    {t.warrantyCategory ? ` · หมวด ${t.warrantyCategory}` : ""}
                    {t.assignedTo ? ` · ${t.assignedTo}` : ""}
                    {t.scheduledDate ? ` · นัด ${t.scheduledDate}` : ""}
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{t.description}</p>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => updateTicketStatus(t.id, e.target.value as TicketStatus)}
                  className="text-xs border rounded-md px-2 py-1"
                >
                  {(Object.keys(TICKET_STATUS_LABEL) as TicketStatus[]).map((s) => (
                    <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              {(t.status === "done" || t.status === "closed") && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span>NPS:</span>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNps(t.id, n)}
                      className={`w-6 h-6 rounded ${t.npsScore === n ? "bg-brand-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-slate-400 text-center py-8">ยังไม่มี Ticket</p>}
        </div>
      )}

      {tab === "followups" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {followups
              .slice()
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((f) => (
                <li key={f.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{f.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {f.propertyCode} · {f.customerName} · กำหนด {f.dueDate}
                      {!f.done && isOverdue(f.dueDate) && (
                        <span className="ml-2 text-red-600 font-medium">เลยกำหนด</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {f.done ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ส่ง LINE แล้ว {f.doneAt}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLineTarget(f)}
                        className="text-xs bg-[#06C755] text-white px-3 py-1.5 rounded-lg"
                      >
                        ส่ง LINE
                      </button>
                    )}
                    {f.lineMessage && (
                      <p className="text-[11px] text-slate-500 max-w-xs text-right whitespace-pre-line">{f.lineMessage}</p>
                    )}
                    {f.done && !f.lineMessage && (
                      <button type="button" className="text-[11px] text-brand-600 hover:underline" onClick={() => setLineTarget(f)}>
                        บันทึกข้อความที่ส่ง
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
          {followups.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีตาราง Follow-up</p>
          )}
        </div>
      )}

      {tab === "schedule" && <ScheduleList reloadToken={reloadToken} />}

      {tab === "referrals" && <ReferralBoard reloadToken={reloadToken} onChange={refresh} />}

      {showNewTicket && (
        <NewTicketModal onClose={() => setShowNewTicket(false)} onSubmit={createTicket} />
      )}
      {lineTarget && (
        <LineFollowupModal item={lineTarget} onClose={() => setLineTarget(null)} onSubmit={sendFollowup} />
      )}
    </div>
  );
}

function MiniCard({
  title,
  value,
  warn,
}: {
  title: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`text-xl font-bold mt-0.5 ${warn ? "text-red-600" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}
