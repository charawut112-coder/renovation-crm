import type { PropertyStatus } from "./data";
import { uid } from "./format";
import {
  assemble,
  emptyOpsState,
  movementError,
  OPS_STORAGE_KEY,
  type Attachment,
  type DesignPhase,
  type OpsState,
  type OpsView,
  type ProgressEntry,
  type ScheduleEntry,
  type StockMoveType,
  type UserMovement,
} from "./ops";
import { UNIT_LABEL, type SalesLead } from "./units";

export function readOpsState(): OpsState {
  if (typeof window === "undefined") return emptyOpsState();
  try {
    const raw = localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return emptyOpsState();
    const parsed = JSON.parse(raw) as Partial<OpsState>;
    const units = parsed.units || {};
    for (const entry of Object.values(units)) {
      if (entry && !Array.isArray(entry.history)) entry.history = [];
    }
    return { ...emptyOpsState(), ...parsed, units };
  } catch {
    return emptyOpsState();
  }
}

export function writeOpsState(state: OpsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(state));
}

export function loadOpsView(): OpsView {
  return assemble(readOpsState());
}

export function resetOpsState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OPS_STORAGE_KEY);
}

function update(mutator: (state: OpsState) => void): OpsState {
  const state = readOpsState();
  mutator(state);
  writeOpsState(state);
  return state;
}

/** เก็บหน่วยปัจจุบันไว้ก่อนแก้ขั้น แบบ หรือตั๋ว เพื่อไม่ให้การคำนวณจากชีตย้ายบ้านเอง */
function pinFlowUnit(state: OpsState, houseId: string) {
  if (!houseId || state.units[houseId]?.unit) return;
  const house = assemble(state).houses.find((item) => item.id === houseId);
  if (!house) return;
  const current = state.units[houseId] || { history: [] };
  current.unit = house.flowUnit;
  state.units[houseId] = current;
}

export function setHouseStep(input: {
  houseId: string;
  to: PropertyStatus;
  from: PropertyStatus;
  note?: string;
  owner?: string;
  due?: string;
}): string | null {
  if (input.from === input.to) return null;
  update((state) => {
    pinFlowUnit(state, input.houseId);
    const current = state.steps[input.houseId] || { dues: {}, owners: {}, history: [] };
    current.step = input.to;
    current.history = [
      ...(current.history || []),
      { at: new Date().toISOString(), from: input.from, to: input.to, note: input.note || "" },
    ];
    if (input.owner) current.owners = { ...current.owners, [input.to]: input.owner };
    if (input.due) current.dues = { ...current.dues, [input.to]: input.due };
    state.steps[input.houseId] = current;
  });
  return null;
}

export function setStepMeta(houseId: string, step: PropertyStatus, patch: { owner?: string; due?: string }) {
  update((state) => {
    const current = state.steps[houseId] || { dues: {}, owners: {}, history: [] };
    if (patch.owner !== undefined) current.owners = { ...current.owners, [step]: patch.owner };
    if (patch.due !== undefined) current.dues = { ...current.dues, [step]: patch.due };
    state.steps[houseId] = current;
  });
}

export function setDesignPhase(id: string, phase: DesignPhase, note: string) {
  update((state) => {
    const houseId = assemble(state).designJobs.find((job) => job.id === id)?.houseId || "";
    pinFlowUnit(state, houseId);
    const current = state.design[id] || { history: [], attachments: [] };
    current.phase = phase;
    current.history = [...(current.history || []), { at: new Date().toISOString(), phase, note, by: "ทีมงาน" }];
    state.design[id] = current;
  });
}

export function setDesignMeta(id: string, patch: { owner?: string; due?: string }) {
  update((state) => {
    const current = state.design[id] || { history: [], attachments: [] };
    if (patch.owner !== undefined) current.owner = patch.owner;
    if (patch.due !== undefined) current.due = patch.due;
    state.design[id] = current;
  });
}

export function addDesignAttachment(id: string, file: Attachment) {
  update((state) => {
    const current = state.design[id] || { history: [], attachments: [] };
    current.attachments = [...(current.attachments || []), file];
    state.design[id] = current;
  });
}

export function handoffHouse(houseId: string, note: string): { ok: true; toLabel: string } | { ok: false; error: string } {
  const view = assemble(readOpsState());
  const house = view.houses.find((item) => item.id === houseId);
  if (!house) return { ok: false, error: "ไม่พบบ้านนี้" };
  if (!house.handoff.next) return { ok: false, error: house.handoff.blockers[0] || "ไม่มีหน่วยถัดไป" };
  if (house.handoff.blockers.length) return { ok: false, error: house.handoff.blockers.join(" · ") };
  const to = house.handoff.next;
  const from = house.flowUnit;
  update((state) => {
    const current = state.units[houseId] || { history: [] };
    current.unit = to;
    current.history = [
      ...(current.history || []),
      {
        at: new Date().toISOString(),
        from,
        to,
        note: note.trim() || "ส่งต่อไปหน่วยถัดไป",
        by: "ทีมงาน",
      },
    ];
    if (to === "sales" && !current.salesLead) current.salesLead = "ลีด";
    if (to === "aftersales") current.handoverConfirmed = true;
    state.units[houseId] = current;
    if (house.handoff.stepTo) {
      const steps = state.steps[houseId] || { dues: {}, owners: {}, history: [] };
      if (house.step !== house.handoff.stepTo) {
        steps.step = house.handoff.stepTo;
        steps.history = [
          ...(steps.history || []),
          {
            at: new Date().toISOString(),
            from: house.step,
            to: house.handoff.stepTo,
            note: `ส่งต่อจาก${UNIT_LABEL[from]}ไป${UNIT_LABEL[to]}`,
          },
        ];
      }
      state.steps[houseId] = steps;
    }
  });
  return { ok: true, toLabel: UNIT_LABEL[to] };
}

export function setSalesLead(houseId: string, salesLead: SalesLead) {
  update((state) => {
    pinFlowUnit(state, houseId);
    const current = state.units[houseId] || { history: [] };
    current.salesLead = salesLead;
    state.units[houseId] = current;
  });
}

export function setSalesCustomer(houseId: string, salesCustomer: string) {
  update((state) => {
    const current = state.units[houseId] || { history: [] };
    current.salesCustomer = salesCustomer;
    state.units[houseId] = current;
  });
}

export function confirmHouseHandover(houseId: string, confirmed: boolean) {
  update((state) => {
    const current = state.units[houseId] || { history: [] };
    current.handoverConfirmed = confirmed;
    state.units[houseId] = current;
  });
}

export function addHouseDoc(houseId: string, file: Attachment) {
  update((state) => {
    const list = (state.docs[houseId] || []).filter((item) => item.id !== file.id);
    state.docs[houseId] = [...list, file];
  });
}

export function recordMovement(input: Omit<UserMovement, "id" | "at">): { ok: true } | { ok: false; error: string } {
  const move: UserMovement = { ...input, id: uid("mv"), at: new Date().toISOString() };
  const state = readOpsState();
  const error = movementError(state, move);
  if (error) return { ok: false, error };
  state.movements = [move, ...state.movements];
  writeOpsState(state);
  return { ok: true };
}

export function setPoPrice(lineId: string, price: number | null) {
  update((state) => {
    if (price == null || Number.isNaN(price)) {
      delete state.poPrice[lineId];
      return;
    }
    state.poPrice[lineId] = price;
  });
}

export function setPoStatus(lineId: string, status: string) {
  update((state) => {
    state.poStatus[lineId] = status;
  });
}

export function updateTicket(
  ticketId: string,
  patch: {
    status?: string;
    craftsman?: string;
    date?: string;
    time?: string;
    evidence?: Attachment;
    closeConfirmed?: boolean;
    closeNote?: string;
  }
) {
  update((state) => {
    if (patch.status || patch.closeConfirmed !== undefined) {
      const view = assemble(state);
      for (const house of view.houses) {
        if (house.tickets.some((ticket) => ticket.id === ticketId)) pinFlowUnit(state, house.id);
      }
    }
    const current = state.tickets[ticketId] || { evidence: [] };
    if (patch.status) current.status = patch.status;
    if (patch.craftsman !== undefined) current.craftsman = patch.craftsman;
    if (patch.date !== undefined) current.date = patch.date;
    if (patch.time !== undefined) current.time = patch.time;
    if (patch.evidence) current.evidence = [...(current.evidence || []), patch.evidence];
    if (patch.closeConfirmed !== undefined) current.closeConfirmed = patch.closeConfirmed;
    if (patch.closeNote !== undefined) current.closeNote = patch.closeNote;
    if (patch.closeConfirmed) current.status = "เสร็จสิ้น";
    state.tickets[ticketId] = current;
  });
}

export function addSchedule(entry: Omit<ScheduleEntry, "id">) {
  update((state) => {
    state.schedules = [{ ...entry, id: uid("sch") }, ...state.schedules];
  });
}

export function addProgress(entry: Omit<ProgressEntry, "id" | "at">) {
  update((state) => {
    state.progress = [{ ...entry, id: uid("pg"), at: new Date().toISOString() }, ...state.progress];
  });
}

export type { StockMoveType };
