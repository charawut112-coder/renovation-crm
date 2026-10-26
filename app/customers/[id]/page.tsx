"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getCustomer,
  updateCustomer,
  type Customer,
  type LeadScore,
} from "@/lib/customers";
import { formatPrice, loadProperties, type Property } from "@/lib/data";
import {
  PRIORITY_LABEL,
  TICKET_STATUS_LABEL,
  loadFollowups,
  loadTickets,
  loadWarranties,
  type AfterSalesTicket,
  type FollowupItem,
  type Warranty,
} from "@/lib/aftersales";

const scoreColor: Record<LeadScore, string> = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-slate-100 text-slate-600",
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [missing, setMissing] = useState(false);
  const [notes, setNotes] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    const found = getCustomer(id) || null;
    setCustomer(found);
    setMissing(!found);
    setNotes(found?.notes || "");
    if (!found) return;
    const props = loadProperties().filter(
      (p) => p.customerId === found.id || p.code === found.interestedPropertyCode
    );
    const ids = new Set(props.map((p) => p.id));
    setProperties(props);
    setWarranties(
      loadWarranties().filter((w) => ids.has(w.propertyId) || w.customerName === found.fullName)
    );
    setTickets(
      loadTickets().filter((t) => ids.has(t.propertyId) || t.customerName === found.fullName)
    );
    setFollowups(
      loadFollowups().filter((f) => ids.has(f.propertyId) || f.customerName === found.fullName)
    );
  }, [id]);

  function saveNotes() {
    if (!customer) return;
    updateCustomer(customer.id, { notes });
    setSavedNote(true);
    window.setTimeout(() => setSavedNote(false), 1600);
  }

  if (!customer) {
    return (
      <div className="p-8">
        <Link href="/customers" className="text-sm text-brand-600 hover:underline">
          ← ลูกค้าทั้งหมด
        </Link>
        <p className="mt-6 text-slate-500">{missing ? "ไม่พบลูกค้า" : "กำลังโหลด..."}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <Link href="/customers" className="text-sm text-brand-600 hover:underline">
          ← ลูกค้าทั้งหมด
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{customer.fullName}</h1>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${scoreColor[customer.leadScore]}`}>
            {customer.leadScore}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">แหล่งที่มา: {customer.source}</p>
      </div>

      <section className="grid sm:grid-cols-2 gap-3">
        <Field label="โทร" value={customer.phone || "—"} />
        <Field label="อีเมล" value={customer.email || "—"} />
        <Field label="งบประมาณ" value={customer.budget || "—"} />
        <Field label="ทำเลที่สนใจ" value={customer.preferredLocation || "—"} />
        <Field label="วัตถุประสงค์" value={customer.purpose || "—"} />
        <Field label="ระยะเวลา" value={customer.timeline || "—"} />
        <Field label="บ้านที่สนใจ" value={customer.interestedPropertyCode || "—"} />
        <Field label="บันทึกเมื่อ" value={new Date(customer.createdAt).toLocaleString("th-TH")} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">โน้ต</h2>
          {savedNote && <span className="text-xs text-green-600">บันทึกแล้ว</span>}
        </div>
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[88px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="บันทึกเพิ่มเติมเกี่ยวกับลูกค้า"
        />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-slate-800 px-5 pt-5">บ้านที่เชื่อมโยง</h2>
        <p className="text-xs text-slate-500 px-5 pb-3">จาก customerId หรือรหัสบ้านที่สนใจ</p>
        {properties.length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">ยังไม่มีบ้านที่เชื่อม</p>}
        {properties.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <Link href={`/properties/${p.id}`} className="text-brand-600 font-medium hover:underline">
                      {p.code}
                    </Link>
                    <div className="text-xs text-slate-400">{p.address}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.status}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{formatPrice(p.purchasePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">รับประกัน / Ticket / Follow-up</h2>
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">รับประกัน ({warranties.length})</h3>
          {warranties.length === 0 && <p className="text-sm text-slate-400">ไม่มีรายการ</p>}
          <ul className="text-sm text-slate-600 space-y-1">
            {warranties.map((w) => (
              <li key={w.id}>
                {w.propertyCode} · {w.category} · ถึง {w.endDate}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">Ticket ({tickets.length})</h3>
          {tickets.length === 0 && <p className="text-sm text-slate-400">ไม่มีรายการ</p>}
          <ul className="text-sm text-slate-600 space-y-1">
            {tickets.map((t) => (
              <li key={t.id}>
                {t.title} · {PRIORITY_LABEL[t.priority]} · {TICKET_STATUS_LABEL[t.status]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">Follow-up ({followups.length})</h3>
          {followups.length === 0 && <p className="text-sm text-slate-400">ไม่มีรายการ</p>}
          <ul className="text-sm text-slate-600 space-y-1">
            {followups.map((f) => (
              <li key={f.id}>
                {f.label} · กำหนด {f.dueDate} {f.done ? "· เสร็จแล้ว" : ""}
              </li>
            ))}
          </ul>
        </div>
        <Link href="/after-sales" className="inline-block text-xs text-brand-600 hover:underline">
          เปิดหน้าระบบหลังการขาย
        </Link>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
