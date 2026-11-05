/** รวมแฟ้มลูกค้า: บ้านที่เชื่อม, ประวัติติดต่อ, และไทม์ไลน์กิจกรรม */

import {
  loadFollowups,
  loadTickets,
  loadWarranties,
  type AfterSalesTicket,
  type FollowupItem,
  type Warranty,
} from "./aftersales";
import { loadLogs } from "./checklist";
import { contactsForCustomer } from "./contacts";
import type { Customer } from "./customers";
import { loadProperties, type Property } from "./data";
import { loadReferrals } from "./referrals";

export type PropertyRole = "เจ้าของบ้าน" | "สนใจ";

export type LinkedProperty = {
  property: Property;
  role: PropertyRole;
};

export type ActivityKind = "ลูกค้า" | "ติดต่อ" | "สถานะ" | "Ticket" | "Follow-up" | "รับประกัน" | "แนะนำ";

export interface CustomerActivity {
  id: string;
  at: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  href?: string;
}

function stamp(value: string): string {
  if (value.length <= 10) return `${value.slice(0, 10)}T12:00:00.000Z`;
  return value;
}

export function linkedProperties(customer: Customer, properties = loadProperties()): LinkedProperty[] {
  return properties
    .filter((property) => property.customerId === customer.id || property.code === customer.interestedPropertyCode)
    .map((property) => ({
      property,
      role: (property.customerId === customer.id ? "เจ้าของบ้าน" : "สนใจ") as PropertyRole,
    }))
    .sort((a, b) => a.property.code.localeCompare(b.property.code, "th"));
}

function propertyIdsOf(links: LinkedProperty[]): Set<string> {
  return new Set(links.map((link) => link.property.id));
}

export function belongsToCustomer(
  record: { propertyId: string; customerName?: string; customerId?: string },
  customer: Customer,
  propertyIds: Set<string>
): boolean {
  if (record.customerId && record.customerId === customer.id) return true;
  if (propertyIds.has(record.propertyId)) return true;
  return Boolean(record.customerName && record.customerName === customer.fullName);
}

export function customerWarranties(customer: Customer, links = linkedProperties(customer)): Warranty[] {
  const ids = propertyIdsOf(links);
  return loadWarranties().filter((item) => belongsToCustomer(item, customer, ids));
}

export function customerTickets(customer: Customer, links = linkedProperties(customer)): AfterSalesTicket[] {
  const ids = propertyIdsOf(links);
  return loadTickets().filter((item) => belongsToCustomer(item, customer, ids));
}

export function customerFollowups(customer: Customer, links = linkedProperties(customer)): FollowupItem[] {
  const ids = propertyIdsOf(links);
  return loadFollowups().filter((item) => belongsToCustomer(item, customer, ids));
}

export function buildCustomerActivities(customer: Customer): CustomerActivity[] {
  const links = linkedProperties(customer);
  const ids = propertyIdsOf(links);
  const items: CustomerActivity[] = [
    {
      id: `created-${customer.id}`,
      at: stamp(customer.createdAt),
      kind: "ลูกค้า",
      title: "บันทึกลูกค้าเข้าระบบ",
      detail: `แหล่งที่มา ${customer.source}`,
      href: `/customers/${customer.id}`,
    },
  ];

  for (const contact of contactsForCustomer(customer.id)) {
    items.push({
      id: contact.id,
      at: stamp(contact.createdAt),
      kind: "ติดต่อ",
      title: `${contact.channel}: ${contact.summary}`,
      detail: [contact.propertyCode, contact.by].filter(Boolean).join(" · "),
    });
  }

  for (const log of loadLogs()) {
    if (!ids.has(log.propertyId)) continue;
    items.push({
      id: log.id,
      at: stamp(log.createdAt),
      kind: "สถานะ",
      title: `${log.propertyCode}: ${log.fromStatus ? `${log.fromStatus} → ${log.toStatus}` : log.toStatus}`,
      detail: [log.reason || log.note, log.changedBy].filter(Boolean).join(" · "),
      href: `/properties/${log.propertyId}`,
    });
  }

  for (const ticket of customerTickets(customer, links)) {
    items.push({
      id: ticket.id,
      at: stamp(ticket.createdAt),
      kind: "Ticket",
      title: ticket.title,
      detail: `${ticket.propertyCode} · ${ticket.status}`,
      href: "/after-sales",
    });
  }

  for (const followup of customerFollowups(customer, links)) {
    if (followup.done) continue;
    items.push({
      id: `due-${followup.id}`,
      at: stamp(followup.dueDate),
      kind: "Follow-up",
      title: `กำหนด ${followup.label}`,
      detail: followup.propertyCode,
      href: "/after-sales",
    });
  }

  for (const warranty of customerWarranties(customer, links)) {
    items.push({
      id: `w-start-${warranty.id}`,
      at: stamp(warranty.startDate),
      kind: "รับประกัน",
      title: `เริ่มรับประกัน${warranty.category} · ${warranty.propertyCode}`,
      detail: `ถึง ${warranty.endDate}`,
      href: "/after-sales",
    });
  }

  for (const referral of loadReferrals()) {
    if (referral.referrerCustomerId !== customer.id && referral.convertedCustomerId !== customer.id) continue;
    const incoming = referral.convertedCustomerId === customer.id && referral.referrerCustomerId !== customer.id;
    items.push({
      id: referral.id,
      at: stamp(referral.createdAt),
      kind: "แนะนำ",
      title: incoming
        ? `ถูกแนะนำโดย ${referral.referrerName}`
        : `แนะนำ ${referral.refereeName}`,
      detail: referral.note || referral.propertyCode,
      href: referral.convertedCustomerId ? `/customers/${referral.convertedCustomerId}` : `/customers/${referral.referrerCustomerId}`,
    });
  }

  items.sort((a, b) => b.at.localeCompare(a.at) || a.title.localeCompare(b.title, "th"));
  return items;
}
