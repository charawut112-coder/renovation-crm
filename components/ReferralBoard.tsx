"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCustomers, type Customer } from "@/lib/customers";
import { loadProperties } from "@/lib/data";
import {
  REFERRAL_CHANNELS,
  REFERRAL_REWARD,
  REFERRAL_STATUS_LABEL,
  addReferral,
  convertReferral,
  loadReferrals,
  updateReferral,
  type Referral,
  type ReferralChannel,
  type ReferralStatus,
} from "@/lib/referrals";

export default function ReferralBoard({
  referrerId,
  reloadToken = 0,
  onChange,
}: {
  referrerId?: string;
  reloadToken?: number;
  onChange?: () => void;
}) {
  const [rows, setRows] = useState<Referral[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [referrerCustomerId, setReferrerCustomerId] = useState(referrerId || "");
  const [refereeName, setRefereeName] = useState("");
  const [refereePhone, setRefereePhone] = useState("");
  const [channel, setChannel] = useState<ReferralChannel>("LINE");
  const [propertyCode, setPropertyCode] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function refresh() {
    const list = loadReferrals().filter((item) => !referrerId || item.referrerCustomerId === referrerId);
    setRows(list);
    const people = loadCustomers();
    setCustomers(people);
    setCodes(loadProperties().map((property) => property.code));
    if (!referrerCustomerId && people[0] && !referrerId) setReferrerCustomerId(people[0].id);
    if (referrerId) setReferrerCustomerId(referrerId);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrerId, reloadToken]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  function submit() {
    const referrer = customers.find((customer) => customer.id === referrerCustomerId);
    if (!referrer) {
      setError("เลือกผู้แนะนำ");
      return;
    }
    if (!refereeName.trim()) {
      setError("กรอกชื่อคนที่ถูกแนะนำ");
      return;
    }
    setError(null);
    addReferral({
      referrerCustomerId: referrer.id,
      referrerName: referrer.fullName,
      refereeName: refereeName.trim(),
      refereePhone: refereePhone.trim() || undefined,
      channel,
      propertyCode: propertyCode || undefined,
      note: note.trim() || undefined,
    });
    setRefereeName("");
    setRefereePhone("");
    setNote("");
    refresh();
    onChange?.();
    flash("บันทึกการแนะนำแล้ว");
  }

  function setStatus(id: string, status: ReferralStatus) {
    updateReferral(id, { status });
    refresh();
    onChange?.();
  }

  function convert(id: string) {
    const result = convertReferral(id);
    refresh();
    onChange?.();
    if (result) flash(`บันทึก ${result.customer.fullName} เป็นลูกค้าแล้ว`);
  }

  return (
    <div className="space-y-4">
      {toast && <p className="text-xs text-green-700">{toast}</p>}
      <form
        className="bg-white rounded-xl border border-slate-200 p-4 grid sm:grid-cols-2 gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="sm:col-span-2">
          <h3 className="font-medium text-slate-800">บันทึกการแนะนำเพื่อน</h3>
          <p className="text-xs text-slate-500 mt-0.5">ของสมนาคุณ: {REFERRAL_REWARD}</p>
        </div>
        <label className="text-xs text-slate-600 space-y-1">
          <span>ผู้แนะนำ</span>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={referrerCustomerId}
            disabled={Boolean(referrerId)}
            onChange={(event) => setReferrerCustomerId(event.target.value)}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>ช่องทาง</span>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={channel}
            onChange={(event) => setChannel(event.target.value as ReferralChannel)}
          >
            {REFERRAL_CHANNELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>ชื่อคนที่ถูกแนะนำ</span>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={refereeName}
            onChange={(event) => setRefereeName(event.target.value)}
          />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>เบอร์โทร</span>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={refereePhone}
            onChange={(event) => setRefereePhone(event.target.value)}
          />
        </label>
        <label className="text-xs text-slate-600 space-y-1">
          <span>บ้านที่เกี่ยวข้อง</span>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={propertyCode}
            onChange={(event) => setPropertyCode(event.target.value)}
          >
            <option value="">ไม่ระบุ</option>
            {codes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600 space-y-1 sm:col-span-2">
          <span>โน้ต</span>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="ทำเลหรืองบที่เพื่อนสนใจ"
          />
        </label>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" className="text-sm bg-brand-600 text-white rounded-lg px-3 py-1.5">
            บันทึกการแนะนำ
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-slate-800">
                  {row.referrerName} แนะนำ {row.refereeName}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {row.channel}
                  {row.refereePhone ? ` · ${row.refereePhone}` : ""}
                  {row.propertyCode ? ` · ${row.propertyCode}` : ""}
                </div>
                {row.note && <p className="text-sm text-slate-600 mt-2">{row.note}</p>}
                <p className="text-[11px] text-slate-400 mt-1">{row.reward}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {REFERRAL_STATUS_LABEL[row.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {row.status !== "converted" &&
                (Object.keys(REFERRAL_STATUS_LABEL) as ReferralStatus[])
                  .filter((status) => status !== "converted" && status !== row.status)
                  .map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                      onClick={() => setStatus(row.id, status)}
                    >
                      {REFERRAL_STATUS_LABEL[status]}
                    </button>
                  ))}
              {row.status !== "converted" && row.status !== "declined" && (
                <button
                  type="button"
                  className="text-xs bg-brand-600 text-white rounded-lg px-2 py-1"
                  onClick={() => convert(row.id)}
                >
                  บันทึกเป็นลูกค้า
                </button>
              )}
              {row.convertedCustomerId && (
                <Link href={`/customers/${row.convertedCustomerId}`} className="text-xs text-brand-600 hover:underline self-center">
                  เปิดแฟ้มลูกค้าใหม่
                </Link>
              )}
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีรายการแนะนำ</p>}
      </div>
    </div>
  );
}
