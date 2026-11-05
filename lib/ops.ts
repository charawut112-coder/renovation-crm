import { PIPELINE_STATUSES, type PropertyStatus } from "./data";
import {
  CLOSED_TICKET_STATUSES,
  SNAPSHOT_META,
  loadCatalog,
  ticketIsClosed,
  type Catalog,
  type CatalogDesign,
  type CatalogHouse,
  type CatalogPo,
  type CatalogTicket,
} from "./buildspace";
import { formatMoney, isPastDate, todayIso, uid } from "./format";

export const WORK_STEPS: PropertyStatus[] = PIPELINE_STATUSES;

export type DesignPhase = "ร่าง" | "รอตรวจ" | "แก้ไข" | "อนุมัติ" | "ไม่ออกแบบ";

export const DESIGN_PHASES: DesignPhase[] = ["ร่าง", "รอตรวจ", "แก้ไข", "อนุมัติ", "ไม่ออกแบบ"];

export function phaseFromRaw(status: string): DesignPhase {
  if (status === "ไม่ออกแบบ") return "ไม่ออกแบบ";
  if (status === "เสร็จสมบูรณ์") return "อนุมัติ";
  if (status.includes("แก้ไข")) return "แก้ไข";
  if (status.includes("รอ Approve") || status.includes("รอตรวจ")) return "รอตรวจ";
  return "ร่าง";
}

export const DESIGN_NEXT: Record<DesignPhase, DesignPhase[]> = {
  ร่าง: ["รอตรวจ"],
  รอตรวจ: ["แก้ไข", "อนุมัติ"],
  แก้ไข: ["รอตรวจ"],
  อนุมัติ: [],
  ไม่ออกแบบ: ["ร่าง"],
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
  kind: "แบบ" | "รูปอ้างอิง" | "หลักฐาน" | "เอกสาร" | "ความคืบหน้า";
};

export type DesignEvent = {
  at: string;
  phase: DesignPhase;
  note: string;
  by: string;
};

export type StepEvent = {
  at: string;
  from: PropertyStatus;
  to: PropertyStatus;
  note: string;
};

export type StockMoveType = "รับเข้า" | "เบิกออก" | "ย้ายคลัง" | "คืน" | "เคลม";

export type UserMovement = {
  id: string;
  at: string;
  type: StockMoveType;
  materialId: string;
  qty: number;
  from: string;
  to: string;
  houseId: string;
  note: string;
  photoUrl: string;
};

export type ScheduleEntry = {
  id: string;
  craftsman: string;
  date: string;
  time: string;
  houseId: string;
  ticketId: string;
  note: string;
};

export type ProgressEntry = {
  id: string;
  at: string;
  houseId: string;
  craftsman: string;
  note: string;
  percent: number | null;
  photoUrl: string;
  photoName: string;
};

export type OpsState = {
  steps: Record<
    string,
    {
      step?: PropertyStatus;
      dues: Partial<Record<PropertyStatus, string>>;
      owners: Partial<Record<PropertyStatus, string>>;
      history: StepEvent[];
    }
  >;
  design: Record<
    string,
    {
      phase?: DesignPhase;
      owner?: string;
      due?: string;
      history: DesignEvent[];
      attachments: Attachment[];
    }
  >;
  movements: UserMovement[];
  poPrice: Record<string, number>;
  poStatus: Record<string, string>;
  tickets: Record<
    string,
    {
      status?: string;
      craftsman?: string;
      date?: string;
      time?: string;
      evidence: Attachment[];
      closeConfirmed?: boolean;
      closeNote?: string;
    }
  >;
  schedules: ScheduleEntry[];
  progress: ProgressEntry[];
  docs: Record<string, Attachment[]>;
};

export const OPS_STORAGE_KEY = "buildspace-ops-v1";

export function emptyOpsState(): OpsState {
  return {
    steps: {},
    design: {},
    movements: [],
    poPrice: {},
    poStatus: {},
    tickets: {},
    schedules: [],
    progress: [],
    docs: {},
  };
}

export type StepState = {
  step: PropertyStatus;
  state: "done" | "current" | "upcoming";
  owner: string;
  due: string;
  late: boolean;
};

export type DesignJobView = {
  id: string;
  key: string;
  project: string;
  houseNo: string;
  soi: string;
  houseId: string;
  rawStatus: string;
  phase: DesignPhase;
  owner: string;
  due: string;
  startedOn: string;
  note: string;
  late: boolean;
  history: DesignEvent[];
  attachments: Attachment[];
  next: DesignPhase[];
};

export type TicketView = {
  id: string;
  key: string;
  houseId: string;
  project: string;
  houseNo: string;
  soi: string;
  problem: string;
  note: string;
  status: string;
  closed: boolean;
  late: boolean;
  craftsman: string;
  time: string;
  date: string;
  evidence: Attachment[];
  closeConfirmed: boolean;
  closeNote: string;
};

export type PoLineView = CatalogPo & {
  houseId: string;
  status: string;
  unitPrice: number | null;
  lineCost: number | null;
};

export type MovementView = {
  id: string;
  at: string;
  type: string;
  materialId: string;
  materialName: string;
  qty: number;
  unit: string;
  from: string;
  to: string;
  houseId: string;
  houseLabel: string;
  note: string;
  recorder: string;
  photoUrl: string;
  source: "ชีต" | "บันทึกในแอป";
};

export type MaterialView = {
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
  onHand: number;
  locations: { location: string; qty: number }[];
  low: boolean;
  stockValue: number;
};

export type HistoryEvent = {
  id: string;
  title: string;
  detail: string;
  at: string;
};

export type DocSlot = {
  id: string;
  name: string;
  hint: string;
  file: Attachment | null;
};

export type HouseView = {
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
  source: CatalogHouse["source"];
  duplicate: boolean;
  label: string;
  step: PropertyStatus;
  stepOwner: string;
  stepDue: string;
  steps: StepState[];
  late: boolean;
  lateReasons: string[];
  design: DesignJobView | null;
  tickets: TicketView[];
  openTickets: number;
  siteStatus: string;
  siteNote: string;
  purchaseLines: PoLineView[];
  history: HistoryEvent[];
  docs: DocSlot[];
  stockCost: number;
  poCost: number;
  poUnpriced: number;
  totalCost: number;
  /** หลังแรกของโครงการ+เลขที่ — ใช้รวมต้นทุนไม่ให้แถวซ้ำในชีตถูกนับสองรอบ */
  isCostOwner: boolean;
  progress: ProgressEntry[];
};

export type OverlapGroup = {
  craftsman: string;
  when: string;
  items: { id: string; label: string; houseLabel: string }[];
};

export type LateItem = {
  id: string;
  kind: "แจ้งซ่อม" | "แบบ" | "ขั้นตอน";
  label: string;
  detail: string;
  href: string;
};

export type OpsView = {
  generatedAt: string;
  houses: HouseView[];
  materials: MaterialView[];
  lowStock: MaterialView[];
  movements: MovementView[];
  purchaseLines: PoLineView[];
  designJobs: DesignJobView[];
  tickets: TicketView[];
  openTickets: TicketView[];
  craftsmanNames: string[];
  locations: string[];
  overlaps: OverlapGroup[];
  appointments: { id: string; craftsman: string; when: string; houseLabel: string; label: string }[];
  lateItems: LateItem[];
  kpis: {
    housesOnSheet: number;
    byHouseStatus: { status: string; count: number }[];
    byStep: { step: PropertyStatus; count: number }[];
    lateCount: number;
    openAfterSales: number;
    lowStock: number;
    stockValue: number;
  };
};

const DOC_SLOTS: { id: string; name: string; hint: string }[] = [
  { id: "contract", name: "สัญญาจ้างรีโนเวท", hint: "ยังไม่มีไฟล์สัญญาใน snapshot" },
  { id: "quote", name: "ใบเสนอราคา", hint: "ยังไม่มีใบเสนอราคาใน snapshot" },
  { id: "drawing", name: "แบบที่อนุมัติ", hint: "แนบไฟล์หรือใช้รูปจากงานออกแบบ" },
  { id: "handover", name: "ใบส่งมอบงาน", hint: "ยังไม่มีใบส่งมอบใน snapshot" },
];

export function deriveWorkStep(input: {
  houseStatus: string;
  designRaw: string;
  siteStatus: string;
  openAfterSales: boolean;
}): PropertyStatus {
  const hs = input.houseStatus;
  const design = input.designRaw;
  if (hs === "เสร็จสิ้น" && input.openAfterSales) return "หลังการขาย";
  if (hs === "เสร็จสิ้น") return "ส่งมอบให้ลูกค้า";
  if (hs === "มีประวัติแจ้งซ่อม") return "หลังการขาย";
  if (hs === "กำลังดำเนินงาน") {
    if (design.includes("แก้ไข") || design.includes("รอ Approve")) return "อนุมัติแบบ";
    if (design === "กำลังดำเนินการ") return "ออกแบบ";
    if (input.siteStatus === "ยังไม่สั่งของ" || input.siteStatus === "รอของเข้า") return "เตรียมงาน";
    if (input.houseStatus && design === "" && input.siteStatus === "") return "เริ่มก่อสร้าง";
    return "เริ่มก่อสร้าง";
  }
  if (design === "กำลังดำเนินการ") return "ออกแบบ";
  if (design.includes("รอ Approve")) return "อนุมัติแบบ";
  if (design === "เสร็จสมบูรณ์" || design === "ไม่ออกแบบ") return "เตรียมงาน";
  if (hs === "ยังไม่เริ่ม" || hs === "ไม่มีในชีตสถานะบ้าน" || !hs) return "บ้านเข้าใหม่";
  return "นัดสำรวจ";
}

function primaryHouseId(catalog: Catalog, key: string): string {
  const found = catalog.houses.find((house) => house.key === key);
  return found?.id || "";
}

function designView(job: CatalogDesign, state: OpsState, houseId: string, generatedAt: string): DesignJobView {
  const extra = state.design[job.id];
  const phase = extra?.phase || phaseFromRaw(job.rawStatus);
  const due = extra?.due || "";
  const late = (phase === "แก้ไข" || phase === "รอตรวจ") && (isPastDate(due) || phase === "แก้ไข");
  const attachments: Attachment[] = [...(extra?.attachments || [])];
  if (job.imageUrl && !attachments.some((file) => file.url === job.imageUrl)) {
    attachments.unshift({
      id: `seed-${job.id}`,
      name: "รูปอ้างอิงจากชีต",
      url: job.imageUrl,
      kind: "รูปอ้างอิง",
    });
  }
  const history: DesignEvent[] = [
    {
      at: job.startedOn || generatedAt.slice(0, 10),
      phase: phaseFromRaw(job.rawStatus),
      note: `นำเข้าจากชีตงานออกแบบ · สถานะเดิม «${job.rawStatus || "ว่าง"}»`,
      by: "snapshot",
    },
    ...(extra?.history || []),
  ];
  return {
    id: job.id,
    key: job.key,
    project: job.project,
    houseNo: job.houseNo,
    soi: job.soi,
    houseId,
    rawStatus: job.rawStatus,
    phase,
    owner: extra?.owner || job.craftsman,
    due,
    startedOn: job.startedOn,
    note: job.note,
    late: phase !== "อนุมัติ" && phase !== "ไม่ออกแบบ" && late,
    history,
    attachments,
    next: DESIGN_NEXT[phase],
  };
}

function ticketView(row: CatalogTicket, state: OpsState, houseId: string): TicketView {
  const extra = state.tickets[row.id];
  const status = extra?.status || row.status;
  const closed = Boolean(extra?.closeConfirmed) || ticketIsClosed(status);
  const date = extra?.date || "";
  const time = extra?.time || row.time;
  const late = !closed && (status === "เลื่อนวันเข้า" || isPastDate(date));
  return {
    id: row.id,
    key: row.key,
    houseId,
    project: row.project,
    houseNo: row.houseNo,
    soi: row.soi,
    problem: row.problem,
    note: row.note,
    status: closed && extra?.closeConfirmed ? "เสร็จสิ้น" : status,
    closed,
    late,
    craftsman: extra?.craftsman || row.craftsman,
    time,
    date,
    evidence: extra?.evidence || [],
    closeConfirmed: Boolean(extra?.closeConfirmed),
    closeNote: extra?.closeNote || "",
  };
}

export function assemble(state: OpsState, today = todayIso()): OpsView {
  const catalog = loadCatalog();
  const metaGenerated = SNAPSHOT_META.generatedAt;

  const balances = new Map<string, Map<string, number>>();
  for (const row of catalog.stock) {
    const loc = balances.get(row.materialId) || new Map<string, number>();
    loc.set(row.location, (loc.get(row.location) || 0) + row.qty);
    balances.set(row.materialId, loc);
  }

  const materialById = new Map(catalog.materials.map((item) => [item.id, item]));

  function applyDelta(materialId: string, location: string, delta: number) {
    if (!location) return;
    const loc = balances.get(materialId) || new Map<string, number>();
    loc.set(location, (loc.get(location) || 0) + delta);
    balances.set(materialId, loc);
  }

  for (const move of state.movements) {
    if (move.type === "รับเข้า" || move.type === "คืน") applyDelta(move.materialId, move.to || "คลังกลาง", move.qty);
    if (move.type === "เบิกออก" || move.type === "เคลม") applyDelta(move.materialId, move.from || "คลังกลาง", -move.qty);
    if (move.type === "ย้ายคลัง") {
      applyDelta(move.materialId, move.from, -move.qty);
      applyDelta(move.materialId, move.to, move.qty);
    }
  }

  const materials: MaterialView[] = catalog.materials.map((item) => {
    const loc = balances.get(item.id) || new Map<string, number>();
    const locations = Array.from(loc.entries())
      .map(([location, qty]) => ({ location, qty }))
      .sort((a, b) => a.location.localeCompare(b.location, "th"));
    const onHand = locations.reduce((sum, row) => sum + row.qty, 0);
    const low = item.active && onHand <= item.reorderPoint;
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      brand: item.brand,
      spec: item.spec,
      unit: item.unit,
      price: item.price,
      reorderPoint: item.reorderPoint,
      imageUrl: item.imageUrl,
      onHand,
      locations,
      low,
      stockValue: onHand * item.price,
    };
  });

  const lowStock = materials.filter((item) => item.low).sort((a, b) => a.onHand - b.onHand);

  const designJobs = catalog.design.map((job) =>
    designView(job, state, primaryHouseId(catalog, job.key), metaGenerated)
  );
  const designByKey = new Map<string, DesignJobView[]>();
  for (const job of designJobs) {
    const list = designByKey.get(job.key) || [];
    list.push(job);
    designByKey.set(job.key, list);
  }

  const tickets = catalog.tickets.map((row) => ticketView(row, state, primaryHouseId(catalog, row.key)));
  const ticketsByKey = new Map<string, TicketView[]>();
  for (const ticket of tickets) {
    const list = ticketsByKey.get(ticket.key) || [];
    list.push(ticket);
    ticketsByKey.set(ticket.key, list);
  }

  const sitesByKey = new Map(catalog.sites.map((site) => [site.key, site]));

  const purchaseLines: PoLineView[] = catalog.purchaseLines.map((line) => {
    const unitPrice = state.poPrice[line.id];
    const hasPrice = typeof unitPrice === "number" && !Number.isNaN(unitPrice);
    return {
      ...line,
      houseId: primaryHouseId(catalog, line.key),
      status: state.poStatus[line.id] || line.status,
      unitPrice: hasPrice ? unitPrice : null,
      lineCost: hasPrice ? unitPrice * line.qty : null,
    };
  });
  const poByKey = new Map<string, PoLineView[]>();
  for (const line of purchaseLines) {
    const list = poByKey.get(line.key) || [];
    list.push(line);
    poByKey.set(line.key, list);
  }

  const houseLabel = (house: CatalogHouse) =>
    `${house.project} ${house.houseNo}${house.soi ? ` · ${house.soi}` : ""}`;

  const houses: HouseView[] = catalog.houses.map((house) => {
    const relatedTickets = (ticketsByKey.get(house.key) || []).map((ticket) => ({
      ...ticket,
      houseId: ticket.houseId || house.id,
    }));
    const openTickets = relatedTickets.filter((ticket) => !ticket.closed);
    const design = (designByKey.get(house.key) || [])[0] || null;
    const site = sitesByKey.get(house.key);
    const baseStep = deriveWorkStep({
      houseStatus: house.houseStatus,
      designRaw: design?.rawStatus || "",
      siteStatus: site?.status || "",
      openAfterSales: openTickets.length > 0,
    });
    const stepState = state.steps[house.id];
    const step = stepState?.step || baseStep;
    const stepIndex = WORK_STEPS.indexOf(step);
    const defaultOwner = (target: PropertyStatus) => {
      if (target === "ออกแบบ" || target === "อนุมัติแบบ") return design?.owner || house.craftsman;
      if (target === "หลังการขาย") return openTickets[0]?.craftsman || house.craftsman;
      if (target === "เตรียมงาน") return site?.craftsman || house.craftsman;
      return house.craftsman;
    };
    const steps: StepState[] = WORK_STEPS.map((name, index) => {
      const due = stepState?.dues?.[name] || "";
      const owner = stepState?.owners?.[name] || defaultOwner(name);
      const current = index === stepIndex;
      const late = current && isPastDate(due, today);
      return {
        step: name,
        state: index < stepIndex ? "done" : current ? "current" : "upcoming",
        owner,
        due,
        late,
      };
    });
    const current = steps[stepIndex] || steps[0];
    const costOwner = catalog.houses.find((item) => item.key === house.key)?.id === house.id;
    const lines = poByKey.get(house.key) || [];
    const stockCost = state.movements.reduce((sum, move) => {
      if (!move.houseId) return sum;
      const linked = catalog.houses.find((item) => item.id === move.houseId);
      if (!linked || linked.key !== house.key) return sum;
      const price = materialById.get(move.materialId)?.price || 0;
      if (move.type === "เบิกออก") return sum + move.qty * price;
      if (move.type === "คืน") return sum - move.qty * price;
      return sum;
    }, 0);
    const poCost = lines.reduce((sum, line) => sum + (line.lineCost || 0), 0);
    const poUnpriced = lines.filter((line) => line.lineCost == null && line.status !== "ยกเลิก").length;
    const lateReasons: string[] = [];
    if (current?.late) lateReasons.push(`ขั้น «${step}» เลยกำหนด ${current.due}`);
    for (const ticket of openTickets) {
      if (ticket.late) lateReasons.push(`แจ้งซ่อมค้าง: ${ticket.problem || ticket.status} (${ticket.status})`);
    }
    if (design?.late) lateReasons.push(`งานออกแบบอยู่ขั้น «${design.phase}»`);
    const docs: DocSlot[] = DOC_SLOTS.map((slot) => ({
      ...slot,
      file: (state.docs[house.id] || []).find((file) => file.id === slot.id) || null,
    }));
    if (design?.attachments[0] && !docs[2].file) {
      docs[2] = {
        ...docs[2],
        hint: "มีรูปอ้างอิงจากงานออกแบบ",
        file: { ...design.attachments[0], id: "drawing", kind: "แบบ" },
      };
    }

    const history: HistoryEvent[] = [];
    history.push({
      id: `${house.id}-status`,
      title: "สถานะบ้าน",
      detail: `${house.houseStatus}${house.signStatus ? ` · ป้าย: ${house.signStatus}` : ""} · ช่าง ${house.craftsman || "ยังไม่ระบุ"}`,
      at: "",
    });
    if (design) {
      history.push({
        id: design.id,
        title: `งานออกแบบ · ${design.phase}`,
        detail: design.note || design.rawStatus || "ไม่มีโน้ต",
        at: design.startedOn,
      });
    }
    if (site) {
      history.push({
        id: `${house.id}-site`,
        title: `ของเข้าหน้างาน · ${site.status || "ไม่ระบุ"}`,
        detail: [site.note, site.time].filter(Boolean).join(" · ") || "ไม่มีกำหนดวันในชีต",
        at: "",
      });
    }
    for (const line of lines) {
      history.push({
        id: line.id,
        title: `ใบสั่ง ${line.poNumber} · ${line.status}`,
        detail: `${line.item} ${line.qty} ${line.unit} · ${line.vendor}`,
        at: line.due,
      });
    }
    for (const ticket of relatedTickets) {
      history.push({
        id: ticket.id,
        title: `After-Sales · ${ticket.status}`,
        detail: [ticket.problem, ticket.note, ticket.craftsman, ticket.time].filter(Boolean).join(" · "),
        at: ticket.date,
      });
    }
    for (const move of state.movements.filter((item) => item.houseId === house.id)) {
      const name = materialById.get(move.materialId)?.name || move.materialId;
      history.push({
        id: move.id,
        title: `${move.type} · ${name}`,
        detail: move.note || `${move.qty} หน่วย`,
        at: move.at.slice(0, 10),
      });
    }
    for (const event of stepState?.history || []) {
      history.push({
        id: `${house.id}-${event.at}`,
        title: `เปลี่ยนขั้น ${event.from} → ${event.to}`,
        detail: event.note || "ไม่ระบุเหตุผล",
        at: event.at.slice(0, 10),
      });
    }

    return {
      id: house.id,
      key: house.key,
      project: house.project,
      houseNo: house.houseNo,
      soi: house.soi,
      type: house.type,
      houseStatus: house.houseStatus,
      signStatus: house.signStatus,
      craftsman: house.craftsman || design?.owner || openTickets[0]?.craftsman || "",
      note: house.note,
      source: house.source,
      duplicate: house.duplicate,
      label: houseLabel(house),
      step,
      stepOwner: current?.owner || "",
      stepDue: current?.due || "",
      steps,
      late: lateReasons.length > 0,
      lateReasons,
      design: design ? { ...design, houseId: house.id } : null,
      tickets: relatedTickets,
      openTickets: openTickets.length,
      siteStatus: site?.status || "",
      siteNote: site?.note || "",
      purchaseLines: lines.map((line) => ({ ...line, houseId: house.id })),
      history,
      docs,
      stockCost,
      poCost,
      poUnpriced,
      totalCost: stockCost + poCost,
      isCostOwner: costOwner,
      progress: state.progress.filter((item) => item.houseId === house.id),
    };
  });

  const houseById = new Map(houses.map((house) => [house.id, house]));

  const movements: MovementView[] = [
    ...state.movements.map((move) => {
      const material = materialById.get(move.materialId);
      const house = houseById.get(move.houseId);
      return {
        id: move.id,
        at: move.at,
        type: move.type,
        materialId: move.materialId,
        materialName: material?.name || move.materialId,
        qty: move.qty,
        unit: material?.unit || "",
        from: move.from,
        to: move.to,
        houseId: move.houseId,
        houseLabel: house?.label || "",
        note: move.note,
        recorder: "ทีมงาน",
        photoUrl: move.photoUrl,
        source: "บันทึกในแอป" as const,
      };
    }),
    ...catalog.movements.map((move) => ({
      id: move.id,
      at: move.at,
      type: move.type,
      materialId: move.materialId,
      materialName: move.materialName,
      qty: move.qty,
      unit: move.unit,
      from: move.from,
      to: move.to,
      houseId: primaryHouseId(catalog, move.key),
      houseLabel: move.houseNo ? `${move.project} ${move.houseNo}` : "",
      note: move.note,
      recorder: move.recorder,
      photoUrl: "",
      source: "ชีต" as const,
    })),
  ];

  const openTickets = tickets.filter((ticket) => !ticket.closed);

  type Slot = { craftsman: string; when: string; id: string; label: string; houseLabel: string };
  const slots: Slot[] = [];
  for (const ticket of openTickets) {
    if (!ticket.craftsman || !ticket.time) continue;
    const when = ticket.date ? `${ticket.date} ${ticket.time}` : ticket.time;
    slots.push({
      craftsman: ticket.craftsman,
      when,
      id: ticket.id,
      label: ticket.problem || "แจ้งซ่อม",
      houseLabel: `${ticket.project} ${ticket.houseNo}`,
    });
  }
  for (const entry of state.schedules) {
    if (!entry.craftsman || (!entry.time && !entry.date)) continue;
    const house = houseById.get(entry.houseId);
    slots.push({
      craftsman: entry.craftsman,
      when: [entry.date, entry.time].filter(Boolean).join(" "),
      id: entry.id,
      label: entry.note || "นัดหมาย",
      houseLabel: house?.label || "",
    });
  }
  const grouped = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = `${slot.craftsman}@@${slot.when}`;
    const list = grouped.get(key) || [];
    list.push(slot);
    grouped.set(key, list);
  }
  const overlaps: OverlapGroup[] = [];
  grouped.forEach((items, key) => {
    if (items.length < 2) return;
    const parts = key.split("@@");
    const craftsman = parts[0] || "";
    const when = parts[1] || "";
    overlaps.push({
      craftsman,
      when,
      items: items.map((item) => ({ id: item.id, label: item.label, houseLabel: item.houseLabel })),
    });
  });
  const lateItems: LateItem[] = [];
  for (const ticket of openTickets) {
    if (!ticket.late) continue;
    lateItems.push({
      id: ticket.id,
      kind: "แจ้งซ่อม",
      label: `${ticket.project} ${ticket.houseNo}`,
      detail: `${ticket.status} · ${ticket.problem || "ไม่ระบุปัญหา"}`,
      href: ticket.houseId ? `/houses/${ticket.houseId}` : "/after-sales",
    });
  }
  for (const job of designJobs) {
    if (!job.late) continue;
    lateItems.push({
      id: job.id,
      kind: "แบบ",
      label: `${job.project} ${job.houseNo}`,
      detail: `ขั้น ${job.phase}${job.due ? ` · กำหนด ${job.due}` : ""}`,
      href: "/design",
    });
  }
  for (const house of houses) {
    if (!house.steps.some((step) => step.late)) continue;
    lateItems.push({
      id: `step-${house.id}`,
      kind: "ขั้นตอน",
      label: house.label,
      detail: `ขั้น ${house.step} เลยกำหนด ${house.stepDue}`,
      href: `/houses/${house.id}`,
    });
  }

  const sheetHouses = houses.filter((house) => house.source === "สถานะบ้าน");
  const statusCount = new Map<string, number>();
  for (const house of sheetHouses) {
    statusCount.set(house.houseStatus, (statusCount.get(house.houseStatus) || 0) + 1);
  }
  const stepCount = new Map<PropertyStatus, number>();
  for (const step of WORK_STEPS) stepCount.set(step, 0);
  for (const house of houses) stepCount.set(house.step, (stepCount.get(house.step) || 0) + 1);

  const names = new Set<string>(catalog.craftsmen.map((person) => person.name));
  for (const house of houses) if (house.craftsman) names.add(house.craftsman);
  for (const ticket of tickets) if (ticket.craftsman) names.add(ticket.craftsman);
  for (const job of designJobs) if (job.owner) names.add(job.owner);

  const locations = new Set<string>(["คลังกลาง", "คลังโฮมโปร"]);
  for (const row of catalog.stock) locations.add(row.location);
  for (const move of state.movements) {
    if (move.from) locations.add(move.from);
    if (move.to) locations.add(move.to);
  }

  return {
    generatedAt: metaGenerated,
    houses,
    materials,
    lowStock,
    movements,
    purchaseLines,
    designJobs,
    tickets,
    openTickets,
    craftsmanNames: Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b, "th")),
    locations: Array.from(locations),
    overlaps,
    appointments: slots.map((slot) => ({
      id: slot.id,
      craftsman: slot.craftsman,
      when: slot.when,
      houseLabel: slot.houseLabel,
      label: slot.label,
    })),
    lateItems,
    kpis: {
      housesOnSheet: sheetHouses.length,
      byHouseStatus: Array.from(statusCount.entries()).map(([status, count]) => ({ status, count })),
      byStep: WORK_STEPS.map((step) => ({ step, count: stepCount.get(step) || 0 })),
      lateCount: lateItems.length,
      openAfterSales: openTickets.length,
      lowStock: lowStock.length,
      stockValue: materials.reduce((sum, item) => sum + item.stockValue, 0),
    },
  };
}

export function movementError(state: OpsState, move: UserMovement): string | null {
  if (!move.materialId) return "เลือกวัสดุ";
  if (!(move.qty > 0)) return "จำนวนต้องมากกว่า 0";
  const view = assemble(state);
  const material = view.materials.find((item) => item.id === move.materialId);
  if (!material) return "ไม่พบวัสดุ";
  const needFrom = move.type === "เบิกออก" || move.type === "ย้ายคลัง" || move.type === "เคลม";
  if (needFrom) {
    const from = move.from || "คลังกลาง";
    const qty = material.locations.find((loc) => loc.location === from)?.qty || 0;
    if (qty + 1e-9 < move.qty) return `สต็อก ${from} มี ${qty} ${material.unit} ไม่พอเบิก`;
  }
  if ((move.type === "รับเข้า" || move.type === "คืน" || move.type === "ย้ายคลัง") && !move.to) {
    return "ระบุคลังปลายทาง";
  }
  if (move.type === "ย้ายคลัง" && move.from === move.to) return "คลังต้นทางและปลายทางต้องต่างกัน";
  if ((move.type === "เบิกออก" || move.type === "คืน") && !move.houseId) return "ผูกบ้านเพื่อคิดต้นทุน";
  return null;
}

export function describeStockGap(item: MaterialView): string {
  const gap = Math.max(item.reorderPoint * 2 - item.onHand, item.reorderPoint - item.onHand, 0);
  const suggest = gap > 0 ? gap : item.reorderPoint || 1;
  return `${item.name} คงเหลือ ${item.onHand} ${item.unit} (จุดสั่ง ${item.reorderPoint}) แนะนำสั่งเพิ่มประมาณ ${suggest} ${item.unit} · ราคาคลัง ${formatMoney(item.price)}`;
}

export { uid, CLOSED_TICKET_STATUSES };
