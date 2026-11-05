import snapshotJson from "@/data/buildspace-snapshot.json";
import { driveFileUrl, houseKey, parseNum, parseSheetDate } from "./format";

type Row = Record<string, string>;
type Sheet = { headers: string[]; rowCount: number; rows: Row[] };
type SnapshotFile = {
  spreadsheetId: string;
  title: string;
  generatedAt: string;
  sheets: Record<string, Sheet>;
};

const snapshot = snapshotJson as SnapshotFile;

export const SNAPSHOT_META = {
  spreadsheetId: snapshot.spreadsheetId,
  title: snapshot.title,
  generatedAt: snapshot.generatedAt,
};

function sheet(name: string): Row[] {
  return snapshot.sheets[name]?.rows ?? [];
}

export type CatalogHouse = {
  id: string;
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  type: string;
  houseStatus: string;
  signStatus: string;
  craftsman: string;
  note: string;
  source: "สถานะบ้าน" | "โครงการ" | "Aftersell";
  /** แถวซ้ำในชีตสถานะบ้าน (โครงการ+เลขที่เดียวกัน คนละรายละเอียด) */
  duplicate: boolean;
};

export type CatalogMaterial = {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  unit: string;
  price: number;
  reorderPoint: number;
  imageUrl: string | null;
  active: boolean;
};

export type CatalogStock = {
  id: string;
  materialId: string;
  location: string;
  qty: number;
  price: number;
};

export type CatalogMovement = {
  id: string;
  at: string;
  type: string;
  materialId: string;
  materialName: string;
  qty: number;
  unit: string;
  from: string;
  to: string;
  project: string;
  houseNo: string;
  key: string;
  note: string;
  recorder: string;
};

export type CatalogDesign = {
  id: string;
  seq: string;
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  rawStatus: string;
  startedOn: string;
  note: string;
  craftsman: string;
  imageUrl: string | null;
};

export type CatalogTicket = {
  id: string;
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  status: string;
  craftsman: string;
  time: string;
  problem: string;
  note: string;
};

export type CatalogPo = {
  id: string;
  poNumber: string;
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  category: string;
  item: string;
  qty: number;
  unit: string;
  vendor: string;
  due: string;
  status: string;
  requester: string;
  recorder: string;
};

export type CatalogSite = {
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  status: string;
  time: string;
  note: string;
  craftsman: string;
  imageUrl: string | null;
};

export type CatalogCraftsman = {
  id: string;
  name: string;
  phone: string;
  status: string;
};

export type Catalog = {
  houses: CatalogHouse[];
  materials: CatalogMaterial[];
  stock: CatalogStock[];
  movements: CatalogMovement[];
  design: CatalogDesign[];
  tickets: CatalogTicket[];
  purchaseLines: CatalogPo[];
  sites: CatalogSite[];
  craftsmen: CatalogCraftsman[];
};

let cached: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  cached = buildCatalog();
  return cached;
}

function buildCatalog(): Catalog {
  const statusRows = sheet("สถานะบ้าน");
  const seenKeys = new Map<string, number>();
  const houses: CatalogHouse[] = [];
  const byKey = new Set<string>();

  statusRows.forEach((row) => {
    const project = row["โครงการ"]?.trim() || "ไม่ระบุโครงการ";
    const houseNo = row["เลขที่บ้าน"]?.trim() || "—";
    const key = houseKey(project, houseNo);
    const count = (seenKeys.get(key) || 0) + 1;
    seenKeys.set(key, count);
    const seq = row["ลำดับ"]?.trim() || String(houses.length + 1);
    houses.push({
      id: `h-${seq}`,
      key,
      project,
      houseNo,
      soi: row["ซอย"]?.trim() || "",
      type: row["ประเภทบ้าน"]?.trim() || "",
      houseStatus: row["สถานะบ้าน"]?.trim() || "ไม่ระบุ",
      signStatus: row["สถานะป้าย"]?.trim() || "",
      craftsman: row["ช่าง"]?.trim() || "",
      note: "",
      source: "สถานะบ้าน",
      duplicate: count > 1,
    });
    byKey.add(key);
  });

  for (const row of sheet("โครงการ")) {
    const project = row["ชื่อโครงการ"]?.trim() || "";
    const houseNo = row["บ้านเลขที่"]?.trim() || "";
    if (!project && !houseNo) continue;
    const key = houseKey(project || "ไม่ระบุโครงการ", houseNo || "—");
    const note = row["หมายเหตุ"]?.trim() || "";
    const status = row["สถานะ"]?.trim() || "";
    if (byKey.has(key)) {
      for (const house of houses) {
        if (house.key !== key) continue;
        if (note && !house.note) house.note = note;
      }
      continue;
    }
    houses.push({
      id: `p-${row["ID"] || houses.length}`,
      key,
      project: project || "ไม่ระบุโครงการ",
      houseNo: houseNo || "—",
      soi: row["ซอย"]?.trim() || "",
      type: "",
      houseStatus: status || "ไม่มีในชีตสถานะบ้าน",
      signStatus: "",
      craftsman: "",
      note,
      source: "โครงการ",
      duplicate: false,
    });
    byKey.add(key);
  }

  sheet("Aftersell ปรับปรุง").forEach((row, index) => {
    const project = row["หมู่บ้าน"]?.trim() || "";
    const houseNo = row["บ้านเลขที่"]?.trim() || "";
    if (!project && !houseNo) return;
    const key = houseKey(project || "ไม่ระบุโครงการ", houseNo || "—");
    if (byKey.has(key)) return;
    houses.push({
      id: `ax-${index + 1}`,
      key,
      project: project || "ไม่ระบุโครงการ",
      houseNo: houseNo || "—",
      soi: row["ซอย"]?.trim() || "",
      type: "",
      houseStatus: "มีประวัติแจ้งซ่อม",
      signStatus: "",
      craftsman: row["ช่าง"]?.trim() || "",
      note: "",
      source: "Aftersell",
      duplicate: false,
    });
    byKey.add(key);
  });

  const materials: CatalogMaterial[] = sheet("วัสดุ").map((row) => ({
    id: row["ID"],
    code: row["รหัสวัสดุ"]?.trim() || "",
    name: row["ชื่อวัสดุ"]?.trim() || "ไม่ระบุชื่อ",
    category: row["หมวดหมู่"]?.trim() || "ทั่วไป",
    brand: row["ยี่ห้อ"]?.trim() || "",
    spec: row["ขนาด/รุ่น"]?.trim() || "",
    unit: row["หน่วยนับ"]?.trim() || "",
    price: parseNum(row["ราคาต่อหน่วย"]),
    reorderPoint: parseNum(row["จุดสั่งซื้อขั้นต่ำ"]),
    imageUrl: driveFileUrl(row["รูปภาพ"] || ""),
    active: (row["สถานะ"] || "").trim() !== "ปิดใช้งาน",
  }));

  const stock: CatalogStock[] = sheet("สต็อก").map((row) => ({
    id: row["ID"],
    materialId: row["MaterialID"],
    location: row["พื้นที่จัดเก็บ"]?.trim() || "คลังกลาง",
    qty: parseNum(row["จำนวนคงเหลือ"]),
    price: parseNum(row["ราคาต่อหน่วย"]),
  }));

  const movements: CatalogMovement[] = sheet("รายการเคลื่อนไหว").map((row) => ({
    id: row["ID"],
    at: parseSheetDate(row["วันที่เวลา"] || "") || "",
    type: row["ประเภท"]?.trim() || "ปรับยอด",
    materialId: row["MaterialID"] || "",
    materialName: row["ชื่อวัสดุ"]?.trim() || "",
    qty: parseNum(row["จำนวน"]),
    unit: row["หน่วย"]?.trim() || "",
    from: row["พื้นที่ต้นทาง"]?.trim() || "",
    to: row["พื้นที่ปลายทาง"]?.trim() || "",
    project: row["โครงการ"]?.trim() || "",
    houseNo: row["บ้านเลขที่"]?.trim() || "",
    key: houseKey(row["โครงการ"] || "", row["บ้านเลขที่"] || ""),
    note: row["หมายเหตุ"]?.trim() || "",
    recorder: row["ผู้บันทึก"]?.trim() || "",
  }));

  const design: CatalogDesign[] = sheet("งานออกแบบ").map((row) => {
    const project = row["หมู่บ้าน"]?.trim() || "";
    const houseNo = row["เลขที่"]?.trim() || "";
    return {
      id: `d-${row["ลำดับ"] || houseNo}`,
      seq: row["ลำดับ"]?.trim() || "",
      key: houseKey(project, houseNo),
      project,
      houseNo,
      soi: row["ซอย"]?.trim() || "",
      rawStatus: row["สถานะ"]?.trim() || "",
      startedOn: parseSheetDate(row["วันที่เริ่มทำ"] || "") || "",
      note: row["โน้ต"]?.trim() || "",
      craftsman: row["ช่าง"]?.trim() || "",
      imageUrl: driveFileUrl(row["รูปภาพ"] || ""),
    };
  });

  const tickets: CatalogTicket[] = sheet("Aftersell ปรับปรุง").map((row, index) => {
    const project = row["หมู่บ้าน"]?.trim() || "";
    const houseNo = row["บ้านเลขที่"]?.trim() || "";
    return {
      id: `as-${index + 1}`,
      key: houseKey(project, houseNo),
      project: project || "ไม่ระบุโครงการ",
      houseNo: houseNo || "—",
      soi: row["ซอย"]?.trim() || "",
      status: row["สถานะ"]?.trim() || "ไม่ระบุ",
      craftsman: row["ช่าง"]?.trim() || "",
      time: row["เวลา"]?.trim() || "",
      problem: row["ปัญหา"]?.trim() || "",
      note: row["หมายเหตุ"]?.trim() || "",
    };
  });

  const purchaseLines: CatalogPo[] = sheet("รายการสั่งวัสดุ").map((row, index) => {
    const project = row["โครงการ"]?.trim() || "";
    const houseNo = row["บ้านเลขที่"]?.trim() || "";
    return {
      id: `po-${index + 1}`,
      poNumber: row["เลขที่ใบสั่ง"]?.trim() || `PO-${index + 1}`,
      key: houseKey(project, houseNo),
      project,
      houseNo,
      soi: row["ซอย"]?.trim() || "",
      category: row["หมวดวัสดุ"]?.trim() || "",
      item: row["รายการวัสดุ"]?.trim() || "",
      qty: parseNum(row["จำนวน"]),
      unit: row["หน่วย"]?.trim() || "",
      vendor: row["ผู้ขาย/ร้าน"]?.trim() || "",
      due: parseSheetDate(row["กำหนดส่ง"] || "") || "",
      status: row["สถานะ"]?.trim() || "ไม่ระบุ",
      requester: row["ช่างผู้ขอ"]?.trim() || "",
      recorder: row["ผู้บันทึก"]?.trim() || "",
    };
  });

  const sites: CatalogSite[] = sheet("สถานะสั่งของเข้าหน้างาน").map((row) => {
    const project = row["หมู่บ้าน"]?.trim() || "";
    const houseNo = row["เลขที่"]?.trim() || "";
    return {
      key: houseKey(project, houseNo),
      project,
      houseNo,
      soi: row["ซอย"]?.trim() || "",
      status: row["สถานะ"]?.trim() || "",
      time: row["เวลาของเข้า"]?.trim() || "",
      note: row["โน้ต"]?.trim() || "",
      craftsman: row["ช่าง"]?.trim() || "",
      imageUrl: driveFileUrl(row["รูปภาพ"] || ""),
    };
  });

  const craftsmen: CatalogCraftsman[] = sheet("ช่าง").map((row) => ({
    id: row["ID"] || row["ชื่อช่าง"],
    name: row["ชื่อช่าง"]?.trim() || "ไม่ระบุชื่อ",
    phone: row["เบอร์โทร"]?.trim() || "",
    status: row["สถานะ"]?.trim() || "",
  }));

  return { houses, materials, stock, movements, design, tickets, purchaseLines, sites, craftsmen };
}

export const CLOSED_TICKET_STATUSES = new Set(["ลงคิวเสร็จสมบูรณ์", "เสร็จสิ้น", "แก้ไขแล้ว"]);

export function ticketIsClosed(status: string): boolean {
  return CLOSED_TICKET_STATUSES.has(status.trim());
}
