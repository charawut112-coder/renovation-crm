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

export function readOpsState(): OpsState {
  if (typeof window === "undefined") return emptyOpsState();
  try {
    const raw = localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return emptyOpsState();
    const parsed = JSON.parse(raw) as Partial<OpsState>;
    return { ...emptyOpsState(), ...parsed };
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
