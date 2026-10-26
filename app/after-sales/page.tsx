"use client";

import { useEffect, useState } from "react";
import {
  loadWarranties,
  saveWarranties,
  loadTickets,
  saveTickets,
  loadFollowups,
  saveFollowups,
  createAfterSalesPackage,
  warrantyExpiringSoon,
  isOverdue,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  TICKET_STATUS_LABEL,
  WARRANTY_POLICY,
  type Warranty,
  type AfterSalesTicket,
  type FollowupItem,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/aftersales";
import { loadProperties } from "@/lib/data";
import NewTicketModal from "@/components/NewTicketModal";

type Tab = "warranties" | "tickets" | "followups";

export default function AfterSalesPage() {
  const [tab, setTab] = useState<Tab>("warranties");
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  function refresh() {
    setWarranties(loadWarranties());
    setTickets(loadTickets());
    setFollowups(loadFollowups());
  }

  useEffect(() => {
    refresh();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function markFollowupDone(id: string) {
    const next = followups.map((f) =>
      f.id === id ? { ...f, done: true, doneAt: new Date().toISOString().slice(0, 10) } : f
    );
    setFollowups(next);
    saveFollowups(next);
    showToast("บันทึก Follow-up แล้ว");
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

  function createTicket(form: {
    propertyCode: string;
    customerName: string;
    customerPhone: string;
    title: string;
    description: string;
    priority: TicketPriority;
    underWarranty: boolean;
  }) {
    const props = loadProperties();
    const prop = props.find((p) => p.code === form.propertyCode);
    const ticket: AfterSalesTicket = {
      id: `t-${Date.now()}`,
      propertyId: prop?.id || "unknown",
      propertyCode: form.propertyCode,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: "open",
      underWarranty: form.underWarranty,
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    saveTickets(next);
    setShowNewTicket(false);
    showToast("สร้าง Ticket แล้ว");
  }

  function syncFromHandover() {
    const props = loadProperties().filter(
      (p) => p.status === "ส่งมอบให้ลูกค้า" || p.status === "หลังการขาย"
    );
    let count = 0;
    props.forEach((p) => {
      const r = createAfterSalesPackage({
        propertyId: p.id,
        propertyCode: p.code,
        customerName: "ลูกค้าผู้รับมอบ",
        handoverDate: new Date().toISOString(),
      });
      if (r.created) count++;
    });
    refresh();
    showToast(
      count > 0
        ? `สร้าง Warranty + Follow-up สำหรับ ${count} หลัง`
        : "ไม่มีบ้านใหม่ที่ต้องสร้าง (มีแพ็กเกจอยู่แล้ว)"
    );
  }

  const expiring = warranties.filter((w) => warrantyExpiringSoon(w, 30));
  const openTickets = tickets.filter((t) => !["done", "closed"].includes(t.status));
  const pendingFollowups = followups.filter((f) => !f.done);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "warranties", label: "รับประกัน", count: warranties.length },
    { id: "tickets", label: "Ticket ซ่อม", count: openTickets.length },
    { id: "followups", label: "Follow-up", count: pendingFollowups.length },
  ];

  return (
    <div className="p-8 relative max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">หลังการขาย</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            ตามสเปก §6: Warranty · Auto Follow-up · Maintenance Ticket
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

      <div className="flex gap-1 border-b border-slate-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
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

      {tab === "warranties" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
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
              {warranties.map((w) => {
                const soon = warrantyExpiringSoon(w);
                const expired = w.status === "active" && new Date(w.endDate) < new Date();
                return (
                  <tr key={w.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-brand-600">{w.propertyCode}</td>
                    <td className="px-4 py-3">{w.customerName}</td>
                    <td className="px-4 py-3">
                      <div>{w.category}</div>
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
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                        {expired ? "หมดอายุ" : w.status === "active" ? "คุ้มครอง" : w.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {warranties.length === 0 && (
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
                  {f.done ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">เสร็จแล้ว {f.doneAt}</span>
                  ) : (
                    <button
                      onClick={() => markFollowupDone(f.id)}
                      className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700"
                    >
                      ทำแล้ว (ส่ง LINE จำลอง)
                    </button>
                  )}
                </li>
              ))}
          </ul>
          {followups.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">ยังไม่มีตาราง Follow-up</p>
          )}
        </div>
      )}

      {showNewTicket && (
        <NewTicketModal onClose={() => setShowNewTicket(false)} onSubmit={createTicket} />
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
