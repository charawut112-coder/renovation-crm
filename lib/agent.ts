import { formatIsoDate, formatMoney, formatQty } from "./format";
import { describeStockGap, type HouseView, type OpsView } from "./ops";

export type AgentReply = {
  text: string;
  links?: { href: string; label: string }[];
};

function houseBrief(house: HouseView): string {
  const lines = [
    `${house.label}`,
    `สถานะบ้าน: ${house.houseStatus}${house.signStatus ? ` · ป้าย ${house.signStatus}` : ""}`,
    `ขั้นงาน: ${house.step} · ผู้รับผิดชอบ ${house.stepOwner || "ยังไม่ระบุ"} · กำหนดส่ง ${house.stepDue ? formatIsoDate(house.stepDue) : "ยังไม่ระบุ"}`,
    `ช่างหลัก: ${house.craftsman || "ยังไม่ระบุ"}`,
  ];
  if (house.design) {
    lines.push(
      `ออกแบบ: ${house.design.phase} (${house.design.rawStatus || "ไม่มีสถานะเดิม"}) · ${house.design.owner || "ไม่มีผู้รับผิดชอบ"}`
    );
  }
  if (house.siteStatus) lines.push(`ของเข้าหน้างาน: ${house.siteStatus}`);
  if (house.tickets.length) {
    lines.push(
      `After-Sales ${house.tickets.length} เรื่อง (เปิด ${house.openTickets}): ${house.tickets
        .slice(0, 4)
        .map((ticket) => `${ticket.status} ${ticket.problem || ""}`.trim())
        .join(" · ")}`
    );
  } else {
    lines.push("After-Sales: ไม่มีรายการในชีต");
  }
  if (house.purchaseLines.length) {
    const priced = house.purchaseLines.reduce((sum, line) => sum + (line.lineCost || 0), 0);
    lines.push(
      `ใบสั่งวัสดุ ${house.purchaseLines.length} รายการ · ต้นทุนที่ระบุราคาแล้ว ${formatMoney(priced)} · ยังไม่มีราคา ${house.poUnpriced} รายการ`
    );
  }
  lines.push(`ต้นทุนที่ผูกบ้าน (เบิกสต็อก + ราคาใบสั่งที่กรอก): ${formatMoney(house.totalCost)}`);
  if (house.lateReasons.length) lines.push(`จุดที่ล่าช้า: ${house.lateReasons.join(" | ")}`);
  if (house.note) lines.push(`หมายเหตุโครงการ: ${house.note}`);
  return lines.join("\n");
}

function findHouses(query: string, view: OpsView): HouseView[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const number = q.match(/\d+\s*\/\s*\d+/)?.[0]?.replace(/\s/g, "");
  return view.houses.filter((house) => {
    const blob = `${house.project} ${house.houseNo} ${house.soi} ${house.label}`.toLowerCase();
    if (number && house.houseNo.replace(/\s/g, "") === number) return true;
    if (q.length >= 3 && (blob.includes(q) || q.includes(house.project.toLowerCase()))) return true;
    return false;
  });
}

function summary(view: OpsView): string {
  const statusLine = view.kpis.byHouseStatus.map((row) => `${row.status} ${row.count}`).join(" · ");
  const late = view.lateItems.slice(0, 6).map((item) => `- [${item.kind}] ${item.label}: ${item.detail}`);
  const open = view.openTickets.slice(0, 6).map(
    (ticket) => `- ${ticket.project} ${ticket.houseNo}: ${ticket.problem || "ไม่ระบุปัญหา"} (${ticket.status}${ticket.craftsman ? ` · ${ticket.craftsman}` : ""})`
  );
  return [
    `สรุปงานค้างจากข้อมูลในระบบ (snapshot ${view.generatedAt})`,
    `บ้านในชีตสถานะบ้าน ${view.kpis.housesOnSheet} หลัง — ${statusLine || "ไม่มีแถว"}`,
    `After-Sales ยังไม่ปิด ${view.kpis.openAfterSales} เรื่อง · งานล่าช้า ${view.kpis.lateCount} รายการ · สต็อกถึงจุดสั่งซื้อ ${view.kpis.lowStock} รายการ`,
    view.overlaps.length
      ? `คิวช่างซ้อน ${view.overlaps.length} ช่วง เช่น ${view.overlaps[0].craftsman} เวลา ${view.overlaps[0].when} (${view.overlaps[0].items.length} งาน)`
      : "ยังไม่พบเวลาช่างซ้อนในงานที่ยังเปิด",
    late.length ? `งานล่าช้า:\n${late.join("\n")}` : "ไม่มีงานที่เข้าเกณฑ์ล่าช้า (สถานะเลื่อนวันเข้า / แบบค้างแก้ไข / เลยกำหนดส่ง)",
    open.length ? `แจ้งซ่อมที่ยังเปิด:\n${open.join("\n")}` : "ไม่มีแจ้งซ่อมค้าง",
  ].join("\n\n");
}

function plan(view: OpsView): string {
  const delayed = view.openTickets.filter((ticket) => ticket.late);
  const design = view.designJobs.filter((job) => job.phase === "แก้ไข" || job.phase === "รอตรวจ");
  const active = view.houses.filter((house) => house.houseStatus === "กำลังดำเนินงาน" && house.source === "สถานะบ้าน");
  const load = new Map<string, number>();
  for (const house of active) {
    const name = house.craftsman || "ยังไม่ระบุช่าง";
    load.set(name, (load.get(name) || 0) + 1);
  }
  const busiest = Array.from(load.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const reorder = view.lowStock.slice(0, 5).map((item) => `- ${describeStockGap(item)}`);
  const lines = [
    "แผนงานที่จัดจากคิวในระบบวันนี้",
    "1) เคลียร์ After-Sales ที่ล่าช้าหรือถูกเลื่อนวันเข้าก่อน",
    delayed.length
      ? delayed
          .slice(0, 6)
          .map((ticket) => `- ${ticket.craftsman || "ยังไม่ระบุช่าง"} → ${ticket.project} ${ticket.houseNo} (${ticket.status}) ${ticket.problem}`)
          .join("\n")
      : "- ไม่มีเรื่องที่สถานะเลื่อนวันเข้า",
    "2) แบบที่ค้างตรวจหรือต้องแก้ — ไม่ควรเดินหน้าสั่งของซ้ำถ้าแบบยังไม่ผ่าน",
    design.length
      ? design
          .map((job) => `- ${job.project} ${job.houseNo}: ${job.phase} · ${job.owner || "ไม่มีผู้รับผิดชอบ"}`)
          .join("\n")
      : "- ไม่มีแบบค้างตรวจ",
    "3) สต็อกที่ถึงจุดสั่งซื้อ (ยังไม่ตัดของออกจากคลังจนกว่าจะออกใบสั่ง)",
    reorder.length ? reorder.join("\n") : "- ไม่มีรายการต่ำกว่าจุดสั่งซื้อ",
    "4) บ้านที่กำลังดำเนินงาน กระจายตามช่าง — ถ้าคนเดียวกันมีหลายหลัง ให้เลื่อนบ้านที่ของยังไม่เข้าไปหลังคิวซ่อม",
    busiest.map(([name, count]) => `- ${name}: ${count} หลังที่สถานะกำลังดำเนินงาน`).join("\n") || "- ไม่มีบ้านกำลังดำเนินงาน",
  ];
  if (view.overlaps.length) {
    lines.push(
      `5) เวลานัดที่ซ้อน: ${view.overlaps
        .slice(0, 3)
        .map((group) => `${group.craftsman} (${group.when})`)
        .join(", ")} — แยกช่วงเวลาในหน้าคิวช่างก่อนยืนยันลูกค้า`
    );
  }
  return lines.join("\n\n");
}

function stockAnswer(view: OpsView): string {
  if (!view.lowStock.length) return "ไม่มีวัสดุที่คงเหลือต่ำกว่าหรือเท่ากับจุดสั่งซื้อ";
  return [
    `สต็อกถึงจุดสั่งซื้อ ${view.lowStock.length} รายการ จาก ${view.materials.length} รายการ · มูลค่าคงเหลือรวม ${formatMoney(view.kpis.stockValue)}`,
    ...view.lowStock.slice(0, 12).map((item) => `- ${item.code} ${describeStockGap(item)}`),
    view.lowStock.length > 12 ? `…อีก ${view.lowStock.length - 12} รายการ ดูในหน้าสต็อก` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function craftsmanAnswer(view: OpsView): string {
  const lines = view.craftsmanNames.map((name) => {
    const houses = view.houses.filter(
      (house) => house.craftsman === name && house.houseStatus === "กำลังดำเนินงาน" && house.source === "สถานะบ้าน"
    );
    const tickets = view.openTickets.filter((ticket) => ticket.craftsman === name);
    const overlaps = view.overlaps.filter((group) => group.craftsman === name);
    return `- ${name}: บ้านกำลังทำ ${houses.length} · แจ้งซ่อมเปิด ${tickets.length}${
      overlaps.length ? ` · เวลาซ้อน ${overlaps.length} ช่วง` : ""
    }`;
  });
  return ["คิวช่างจากงานที่ยังไม่ปิด", ...lines].join("\n");
}

export function answerAgent(question: string, view: OpsView): AgentReply {
  const text = question.trim();
  const links: AgentReply["links"] = [];
  const number = text.match(/\d+\s*\/\s*\d+/);
  const houses = findHouses(text, view);
  const asksHistory = /ประวัติ|ค้น|บ้าน|สถานะ|แบบ|ซ่อม|ต้นทุน/.test(text);

  if ((number || (houses.length > 0 && houses.length <= 4 && asksHistory)) && houses.length) {
    const unique = new Map<string, HouseView>();
    for (const house of houses) {
      if (!unique.has(house.key)) unique.set(house.key, house);
    }
    const picked = Array.from(unique.values()).slice(0, 3);
    for (const house of picked) links.push({ href: `/houses/${house.id}`, label: house.label });
    const more = unique.size > picked.length ? `\n\nพบ ${unique.size} หลังที่ชื่อคล้ายกัน แสดง 3 หลังแรก` : "";
    return {
      text: `ประวัติจากข้อมูลในระบบ\n\n${picked.map(houseBrief).join("\n\n---\n\n")}${more}`,
      links,
    };
  }

  if (/แผน/.test(text)) {
    links.push({ href: "/work", label: "เปิดสถานะงาน" }, { href: "/craftsmen", label: "เปิดคิวช่าง" });
    return { text: plan(view), links };
  }
  if (/สต็อก|วัสดุ|จุดสั่ง|ของหมด|คลัง/.test(text)) {
    links.push({ href: "/stock", label: "เปิดสต็อก" });
    return { text: stockAnswer(view), links };
  }
  if (/ช่าง|คิว|ซ้อน/.test(text)) {
    links.push({ href: "/craftsmen", label: "เปิดคิวช่าง" });
    return { text: craftsmanAnswer(view), links };
  }
  if (/สรุป|ค้าง|backlog|ภาพรวม|วันนี้|งาน/.test(text) || text.length < 2) {
    links.push(
      { href: "/after-sales", label: "After-Sales" },
      { href: "/stock", label: "สต็อกต่ำ" },
      { href: "/work", label: "งานล่าช้า" }
    );
    return { text: summary(view), links };
  }

  if (houses.length === 1) {
    links.push({ href: `/houses/${houses[0].id}`, label: houses[0].label });
    return { text: houseBrief(houses[0]), links };
  }

  return {
    text: [
      "พิมพ์ได้เลย เช่น",
      "- สรุปงานค้าง",
      "- เสนอแผนงาน",
      "- สต็อกใกล้หมด",
      "- คิวช่าง",
      "- ประวัติบ้าน 97/269 หรือชื่อโครงการ",
      "",
      summary(view),
    ].join("\n"),
    links: [{ href: "/houses", label: "ค้นบ้านทั้งหมด" }],
  };
}

export function formatAgentQty(n: number): string {
  return formatQty(n);
}
