export const FLOW_UNITS = ["design", "construction", "sales", "aftersales"] as const;

export type FlowUnit = (typeof FLOW_UNITS)[number];

export type WorkspaceUnit = FlowUnit | "stock";

export type DesignPhaseName = "ร่าง" | "รอตรวจ" | "แก้ไข" | "อนุมัติ" | "ไม่ออกแบบ";

export type SalesLead = "ลีด" | "นัดดูบ้าน" | "เจรจา" | "ตกลง" | "ส่งมอบแล้ว";

export const SALES_LEADS: SalesLead[] = ["ลีด", "นัดดูบ้าน", "เจรจา", "ตกลง", "ส่งมอบแล้ว"];

export type UnitMove = {
  at: string;
  from: FlowUnit;
  to: FlowUnit;
  note: string;
  by: string;
};

export type UnitAssignment = {
  unit?: FlowUnit;
  history: UnitMove[];
  salesLead?: SalesLead;
  salesCustomer?: string;
  handoverConfirmed?: boolean;
};

export type HandoffCheck = { label: string; ok: boolean };

export type HandoffPlan = {
  next: FlowUnit | null;
  checks: HandoffCheck[];
  blockers: string[];
  stepTo: "เตรียมงาน" | "หลังการขาย" | null;
};

const STEP_ORDER = [
  "บ้านเข้าใหม่",
  "นัดสำรวจ",
  "ออกแบบ",
  "อนุมัติแบบ",
  "เตรียมงาน",
  "เริ่มก่อสร้าง",
  "ตรวจงานก่อนนำขาย",
  "ส่งมอบให้ลูกค้า",
  "หลังการขาย",
];

const ACTIVE_DESIGN: DesignPhaseName[] = ["ร่าง", "รอตรวจ", "แก้ไข"];
const BUILD_STEPS = new Set(["เตรียมงาน", "เริ่มก่อสร้าง", "ตรวจงานก่อนนำขาย"]);
const SALE_READY_STEPS = new Set(["ตรวจงานก่อนนำขาย", "ส่งมอบให้ลูกค้า", "หลังการขาย"]);

export const UNIT_LABEL: Record<WorkspaceUnit, string> = {
  design: "งานออกแบบ",
  construction: "งานก่อสร้าง",
  sales: "งานขาย",
  aftersales: "งานบริการหลังการขาย",
  stock: "สต็อกวัสดุและจัดซื้อวัสดุ",
};

export const UNIT_HREF: Record<WorkspaceUnit, string> = {
  design: "/design",
  construction: "/construction",
  sales: "/sales",
  aftersales: "/after-sales",
  stock: "/stock",
};

export function nextFlowUnit(unit: FlowUnit): FlowUnit | null {
  const index = FLOW_UNITS.indexOf(unit);
  if (index < 0 || index >= FLOW_UNITS.length - 1) return null;
  return FLOW_UNITS[index + 1];
}

export function resolveFlowUnit(stored: FlowUnit | undefined, derived: FlowUnit): FlowUnit {
  return stored ?? derived;
}

export function deriveFlowUnit(input: {
  houseStatus: string;
  step: string;
  designPhase: DesignPhaseName | null;
  openTickets: number;
}): FlowUnit {
  if (input.step === "หลังการขาย" || input.houseStatus === "มีประวัติแจ้งซ่อม") return "aftersales";
  if (
    input.openTickets > 0 &&
    (input.houseStatus === "เสร็จสิ้น" || input.step === "ส่งมอบให้ลูกค้า" || input.step === "หลังการขาย")
  ) {
    return "aftersales";
  }
  if (input.houseStatus === "เสร็จสิ้น" || input.step === "ส่งมอบให้ลูกค้า") return "sales";
  const designOpen = input.designPhase != null && ACTIVE_DESIGN.includes(input.designPhase);
  if (designOpen && !BUILD_STEPS.has(input.step)) return "design";
  if (BUILD_STEPS.has(input.step) || input.houseStatus === "กำลังดำเนินงาน") return "construction";
  if (input.designPhase === "อนุมัติ" || input.designPhase === "ไม่ออกแบบ") return "construction";
  return "design";
}

export function defaultSalesLead(houseStatus: string): SalesLead {
  if (houseStatus === "เสร็จสิ้น") return "ตกลง";
  return "ลีด";
}

function stepIndex(step: string): number {
  return STEP_ORDER.indexOf(step);
}

export function handoffChecklist(input: {
  unit: FlowUnit;
  designPhase: DesignPhaseName | null;
  step: string;
  salesLead: SalesLead;
  handoverConfirmed: boolean;
  hasHandoverDoc: boolean;
}): HandoffPlan {
  const next = nextFlowUnit(input.unit);
  if (!next) {
    return {
      next: null,
      checks: [],
      blockers: ["หน่วยงานนี้เป็นปลายทางของบ้านหลังนี้"],
      stepTo: null,
    };
  }

  if (input.unit === "design") {
    const approved = input.designPhase === "อนุมัติ" || input.designPhase === "ไม่ออกแบบ";
    const label = input.designPhase
      ? "แบบอนุมัติ หรือระบุว่าไม่ออกแบบ"
      : "มีงานออกแบบและแบบอนุมัติ หรือระบุว่าไม่ออกแบบ";
    const checks = [{ label, ok: approved }];
    const beforeBuild = stepIndex(input.step) >= 0 && stepIndex(input.step) < stepIndex("เตรียมงาน");
    return {
      next,
      checks,
      blockers: checks.filter((item) => !item.ok).map((item) => `ยังส่งต่อไม่ได้ — ${item.label}`),
      stepTo: beforeBuild ? "เตรียมงาน" : null,
    };
  }

  if (input.unit === "construction") {
    const ready = SALE_READY_STEPS.has(input.step);
    const checks = [{ label: "ขั้นงานถึง «ตรวจงานก่อนนำขาย»", ok: ready }];
    return {
      next,
      checks,
      blockers: checks.filter((item) => !item.ok).map((item) => `ยังส่งต่อไม่ได้ — ${item.label}`),
      stepTo: null,
    };
  }

  const agreed = input.salesLead === "ตกลง" || input.salesLead === "ส่งมอบแล้ว";
  const handed = input.handoverConfirmed || input.hasHandoverDoc;
  const checks = [
    { label: "สถานะขายเป็น «ตกลง» หรือ «ส่งมอบแล้ว»", ok: agreed },
    { label: "ยืนยันการส่งมอบ หรือมีใบส่งมอบ", ok: handed },
  ];
  return {
    next,
    checks,
    blockers: checks.filter((item) => !item.ok).map((item) => `ยังส่งต่อไม่ได้ — ${item.label}`),
    stepTo: input.step === "หลังการขาย" ? null : "หลังการขาย",
  };
}

export function materialIssueAllowed(unit: FlowUnit): boolean {
  return unit === "construction";
}

export function constructionColumn(step: string): "prepare" | "build" | "inspect" {
  if (step === "เริ่มก่อสร้าง") return "build";
  if (step === "ตรวจงานก่อนนำขาย" || step === "ส่งมอบให้ลูกค้า" || step === "หลังการขาย") return "inspect";
  return "prepare";
}
