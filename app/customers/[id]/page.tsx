"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReferralBoard from "@/components/ReferralBoard";
import {
  PRIORITY_LABEL,
  TICKET_STATUS_LABEL,
  type AfterSalesTicket,
  type FollowupItem,
  type Warranty,
} from "@/lib/aftersales";
import { appendContact, CONTACT_CHANNELS, contactsForCustomer, type ContactChannel, type ContactEvent } from "@/lib/contacts";
import {
  buildCustomerActivities,
  customerFollowups,
  customerTickets,
  customerWarranties,
  linkedProperties,
  type CustomerActivity,
  type LinkedProperty,
} from "@/lib/customer360";
import { updateCustomer, getCustomer, type Customer, type LeadScore } from "@/lib/customers";
import { assignPropertyCustomer, formatPrice, loadProperties } from "@/lib/data";
import { formatDateTime } from "@/lib/timeline";

const scoreColor: Record<LeadScore, string> = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-slate-100 text-slate-600",
};

const SCORES: LeadScore[] = ["Hot", "Warm", "Cold"];
const fieldClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white";

type Draft = {
  phone: string;
  email: string;
  budget: string;
  preferredLocation: string;
  purpose: string;
  timeline: string;
  bedrooms: string;
  leadScore: LeadScore;
  interestedPropertyCode: string;
  notes: string;
};

function toDraft(customer: Customer): Draft {
  return {
    phone: customer.phone || "",
    email: customer.email || "",
    budget: customer.budget || "",
    preferredLocation: customer.preferredLocation || "",
    purpose: customer.purpose || "",
    timeline: customer.timeline || "",
    bedrooms: customer.bedrooms || "",
    leadScore: customer.leadScore,
    interestedPropertyCode: customer.interestedPropertyCode || "",
    notes: customer.notes || "",
  };
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [links, setLinks] = useState<LinkedProperty[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactEvent[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [tickets, setTickets] = useState<AfterSalesTicket[]>([]);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [channel, setChannel] = useState<ContactChannel>("LINE");
  const [summary, setSummary] = useState("");
  const [contactCode, setContactCode] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  function reload() {
    const found = getCustomer(id) || null;
    setCustomer(found);
    setMissing(!found);
    if (!found) return;
    setDraft(toDraft(found));
    const properties = loadProperties();
    const linked = linkedProperties(found, properties);
    setLinks(linked);
    setCodes(properties.map((property) => property.code));
    setContacts(contactsForCustomer(found.id));
    setActivities(buildCustomerActivities(found));
    setWarranties(customerWarranties(found, linked));
    setTickets(customerTickets(found, linked));
    setFollowups(customerFollowups(found, linked));
    setReloadToken((value) => value + 1);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function saveProfile() {
    if (!customer || !draft) return;
    const next = updateCustomer(customer.id, {
      phone: draft.phone.trim() || undefined,
      email: draft.email.trim() || undefined,
      budget: draft.budget.trim() || undefined,
      preferredLocation: draft.preferredLocation.trim() || undefined,
      purpose: draft.purpose.trim() || undefined,
      timeline: draft.timeline.trim() || undefined,
      bedrooms: draft.bedrooms.trim() || undefined,
      leadScore: draft.leadScore,
      interestedPropertyCode: draft.interestedPropertyCode || undefined,
      notes: draft.notes,
    });
    if (next) setCustomer(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
    reload();
  }

  function addContact() {
    if (!customer || !summary.trim()) return;
    appendContact({
      customerId: customer.id,
      channel,
      summary: summary.trim(),
      propertyCode: contactCode || undefined,
    });
    setSummary("");
    reload();
  }

  function assign(propertyId: string) {
    if (!customer) return;
    assignPropertyCustomer(propertyId, customer);
    appendContact({
      customerId: customer.id,
      channel: "โน้ต",
      summary: `ผูกเป็นลูกค้าหลักของบ้าน ${links.find((link) => link.property.id === propertyId)?.property.code || ""}`.trim(),
      propertyCode: links.find((link) => link.property.id === propertyId)?.property.code,
    });
    reload();
  }

  if (!customer || !draft) {
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
    <div className="p-8 max-w-5xl space-y-6">
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
        <p className="text-sm text-slate-500 mt-1">
          แหล่งที่มา: {customer.source} · บันทึกเมื่อ {formatDateTime(customer.createdAt)}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">ความชอบและข้อมูลติดต่อ</h2>
          {saved && <span className="text-xs text-green-600">บันทึกแล้ว</span>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Label text="โทร">
            <input className={fieldClass} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
          </Label>
          <Label text="อีเมล">
            <input className={fieldClass} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </Label>
          <Label text="งบประมาณ">
            <input className={fieldClass} value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} />
          </Label>
          <Label text="ทำเลที่สนใจ">
            <input
              className={fieldClass}
              value={draft.preferredLocation}
              onChange={(event) => setDraft({ ...draft, preferredLocation: event.target.value })}
            />
          </Label>
          <Label text="วัตถุประสงค์">
            <input className={fieldClass} value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} />
          </Label>
          <Label text="ระยะเวลา">
            <input className={fieldClass} value={draft.timeline} onChange={(event) => setDraft({ ...draft, timeline: event.target.value })} />
          </Label>
          <Label text="จำนวนห้องนอน">
            <input className={fieldClass} value={draft.bedrooms} onChange={(event) => setDraft({ ...draft, bedrooms: event.target.value })} />
          </Label>
          <Label text="คะแนนลีด">
            <select
              className={fieldClass}
              value={draft.leadScore}
              onChange={(event) => setDraft({ ...draft, leadScore: event.target.value as LeadScore })}
            >
              {SCORES.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </Label>
          <Label text="บ้านที่สนใจ">
            <select
              className={fieldClass}
              value={draft.interestedPropertyCode}
              onChange={(event) => setDraft({ ...draft, interestedPropertyCode: event.target.value })}
            >
              <option value="">ไม่ระบุ</option>
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Label>
        </div>
        <Label text="โน้ต">
          <textarea
            className={`${fieldClass} min-h-[88px]`}
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
          />
        </Label>
        <button type="button" onClick={saveProfile} className="text-sm bg-brand-600 text-white rounded-lg px-3 py-1.5">
          บันทึกข้อมูลลูกค้า
        </button>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">ประวัติการติดต่อ</h2>
        <div className="grid sm:grid-cols-4 gap-2">
          <select className={fieldClass} value={channel} onChange={(event) => setChannel(event.target.value as ContactChannel)}>
            {CONTACT_CHANNELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            className={`${fieldClass} sm:col-span-2`}
            placeholder="สรุปการติดต่อ"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
          <select className={fieldClass} value={contactCode} onChange={(event) => setContactCode(event.target.value)}>
            <option value="">ไม่ผูกบ้าน</option>
            {codes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={addContact} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5">
          เพิ่มประวัติ
        </button>
        {contacts.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีประวัติการติดต่อ</p>}
        <ul className="divide-y divide-slate-100">
          {contacts.map((event) => (
            <li key={event.id} className="py-2 text-sm">
              <div className="text-slate-800">
                <span className="text-xs font-medium text-brand-700 mr-2">{event.channel}</span>
                {event.summary}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatDateTime(event.createdAt)} · {event.by}
                {event.propertyCode ? ` · ${event.propertyCode}` : ""}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">ไทม์ไลน์กิจกรรม</h2>
        {activities.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีกิจกรรม</p>}
        <ol className="space-y-3">
          {activities.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <div className="w-24 shrink-0 text-xs text-slate-400 pt-0.5">{formatDateTime(item.at)}</div>
              <div>
                <div className="text-[11px] text-brand-700">{item.kind}</div>
                {item.href ? (
                  <Link href={item.href} className="text-slate-800 hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  <div className="text-slate-800">{item.title}</div>
                )}
                {item.detail && <div className="text-xs text-slate-500">{item.detail}</div>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <h2 className="font-semibold text-slate-800 px-5 pt-5">บ้านที่เชื่อมโยง</h2>
        <p className="text-xs text-slate-500 px-5 pb-3">เจ้าของบ้านมาจาก customerId · สนใจมาจากรหัสบ้านที่สนใจ</p>
        {links.length === 0 && <p className="px-5 pb-5 text-sm text-slate-400">ยังไม่มีบ้านที่เชื่อม</p>}
        {links.length > 0 && (
          <table className="w-full text-sm">
            <tbody>
              {links.map((link) => (
                <tr key={link.property.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <Link href={`/properties/${link.property.id}`} className="text-brand-600 font-medium hover:underline">
                      {link.property.code}
                    </Link>
                    <div className="text-xs text-slate-400">{link.property.address}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{link.role}</td>
                  <td className="px-5 py-3 text-slate-600">{link.property.status}</td>
                  <td className="px-5 py-3 text-right">
                    {link.role === "สนใจ" ? (
                      <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => assign(link.property.id)}>
                        ผูกเป็นลูกค้าหลัก
                      </button>
                    ) : (
                      <span className="text-slate-400">{formatPrice(link.property.purchasePrice)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">รับประกัน / Ticket / Follow-up</h2>
        <RecordList
          title={`รับประกัน (${warranties.length})`}
          empty="ไม่มีรายการ"
          rows={warranties.map((item) => `${item.propertyCode} · ${item.category} · ถึง ${item.endDate} · ${item.status}`)}
        />
        <RecordList
          title={`Ticket (${tickets.length})`}
          empty="ไม่มีรายการ"
          rows={tickets.map((item) => `${item.title} · ${PRIORITY_LABEL[item.priority]} · ${TICKET_STATUS_LABEL[item.status]}`)}
        />
        <RecordList
          title={`Follow-up (${followups.length})`}
          empty="ไม่มีรายการ"
          rows={followups.map((item) => `${item.label} · กำหนด ${item.dueDate}${item.done ? " · ส่งแล้ว" : ""}`)}
        />
        <Link href="/after-sales" className="inline-block text-xs text-brand-600 hover:underline">
          เปิดหน้าระบบหลังการขาย
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">แนะนำเพื่อน</h2>
        <ReferralBoard referrerId={customer.id} reloadToken={reloadToken} onChange={reload} />
      </section>
    </div>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-slate-600 space-y-1">
      <span>{text}</span>
      {children}
    </label>
  );
}

function RecordList({ title, empty, rows }: { title: string; empty: string; rows: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-700 mb-1">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-slate-400">{empty}</p>}
      <ul className="text-sm text-slate-600 space-y-1">
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}
