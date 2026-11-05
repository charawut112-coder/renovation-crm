/** แนะนำเพื่อนหลังการขาย — เก็บใน localStorage */

import { appendContact, type ContactChannel } from "./contacts";
import { addCustomer, getCustomer, type Customer } from "./customers";

export type ReferralStatus = "asked" | "interested" | "converted" | "declined";
export type ReferralChannel = "LINE" | "โทร" | "หน้าร้าน";

export interface Referral {
  id: string;
  referrerCustomerId: string;
  referrerName: string;
  propertyCode?: string;
  refereeName: string;
  refereePhone?: string;
  channel: ReferralChannel;
  status: ReferralStatus;
  note?: string;
  reward: string;
  createdAt: string;
  convertedCustomerId?: string;
}

export const REFERRALS_KEY = "renovation-crm-referrals-v1";

export const REFERRAL_REWARD = "ของสมนาคุณเมื่อบ้านที่แนะนำปิดการขาย";

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  asked: "ถามแล้ว",
  interested: "สนใจ",
  converted: "เป็นลูกค้า",
  declined: "ไม่สนใจ",
};

export const REFERRAL_CHANNELS: ReferralChannel[] = ["LINE", "โทร", "หน้าร้าน"];

const SEED_REFERRALS: Referral[] = [
  {
    id: "ref-c2-1",
    referrerCustomerId: "c2",
    referrerName: "วิภา สุขใจ",
    propertyCode: "RN-2026-006",
    refereeName: "นภาพร วงศ์สุข",
    refereePhone: "086-100-2233",
    channel: "LINE",
    status: "interested",
    note: "สนใจทำเลย่านอารีย์–พญาไท งบใกล้เคียงบ้านที่วิภาซื้อ",
    reward: REFERRAL_REWARD,
    createdAt: "2026-10-18T04:30:00.000Z",
  },
];

function clone(item: Referral): Referral {
  return { ...item };
}

export function loadReferrals(): Referral[] {
  if (typeof window === "undefined") return SEED_REFERRALS.map(clone);
  try {
    const raw = localStorage.getItem(REFERRALS_KEY);
    if (!raw) {
      const seed = SEED_REFERRALS.map(clone);
      localStorage.setItem(REFERRALS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Referral[];
    if (!Array.isArray(parsed)) return SEED_REFERRALS.map(clone);
    const ids = new Set(parsed.map((item) => item.id));
    const missing = SEED_REFERRALS.filter((item) => !ids.has(item.id)).map(clone);
    if (missing.length === 0) return parsed;
    const next = [...parsed, ...missing];
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return SEED_REFERRALS.map(clone);
  }
}

export function saveReferrals(items: Referral[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(items));
}

export function referralsForCustomer(customerId: string): Referral[] {
  return loadReferrals()
    .filter((item) => item.referrerCustomerId === customerId || item.convertedCustomerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function asContactChannel(channel: ReferralChannel): ContactChannel {
  if (channel === "หน้าร้าน") return "Walk-in";
  return channel;
}

export function addReferral(
  input: Omit<Referral, "id" | "createdAt" | "reward" | "status"> & {
    id?: string;
    createdAt?: string;
    reward?: string;
    status?: ReferralStatus;
  }
): Referral {
  const referral: Referral = {
    ...input,
    id: input.id || `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: input.status || "asked",
    reward: input.reward || REFERRAL_REWARD,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  saveReferrals([referral, ...loadReferrals()]);
  appendContact({
    customerId: referral.referrerCustomerId,
    channel: asContactChannel(referral.channel),
    summary: `ขอให้แนะนำเพื่อน: ${referral.refereeName}`,
    propertyCode: referral.propertyCode,
    by: "ทีมงาน",
  });
  return referral;
}

export function updateReferral(id: string, patch: Partial<Omit<Referral, "id" | "createdAt">>): Referral | undefined {
  let updated: Referral | undefined;
  const next = loadReferrals().map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  if (updated) saveReferrals(next);
  return updated;
}

/** ปิดการแนะนำเป็นลูกค้าใหม่ แหล่งที่มาขึ้นต้นว่าแนะนำจาก */
export function convertReferral(id: string): { referral: Referral; customer: Customer } | null {
  const current = loadReferrals().find((item) => item.id === id);
  if (!current || current.status === "declined") return null;
  if (current.convertedCustomerId) {
    const existing = getCustomer(current.convertedCustomerId);
    if (existing) return { referral: current, customer: existing };
  }
  const customer = addCustomer({
    fullName: current.refereeName.trim() || "ลูกค้าจากการแนะนำ",
    phone: current.refereePhone,
    source: `แนะนำจาก ${current.referrerName}`,
    leadScore: "Warm",
    interestedPropertyCode: current.propertyCode,
    notes: current.note || `เข้ามาจากการแนะนำของ ${current.referrerName}`,
  });
  appendContact({
    customerId: current.referrerCustomerId,
    channel: asContactChannel(current.channel),
    summary: `คนที่แนะนำ (${current.refereeName}) ถูกบันทึกเป็นลูกค้าแล้ว`,
    propertyCode: current.propertyCode,
    by: "ทีมงาน",
  });
  appendContact({
    customerId: customer.id,
    channel: asContactChannel(current.channel),
    summary: `เข้ามาจากการแนะนำของ ${current.referrerName}`,
    propertyCode: current.propertyCode,
    by: "ทีมงาน",
  });
  const referral = updateReferral(id, { status: "converted", convertedCustomerId: customer.id });
  if (!referral) return null;
  return { referral, customer };
}
