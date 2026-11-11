import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveFlowUnit,
  handoffChecklist,
  materialIssueAllowed,
  resolveFlowUnit,
} from "../lib/units.ts";

test("บ้านที่แบบยังไม่จบอยู่ในงานออกแบบ", () => {
  assert.equal(
    deriveFlowUnit({
      houseStatus: "กำลังดำเนินงาน",
      step: "อนุมัติแบบ",
      designPhase: "รอตรวจ",
      openTickets: 0,
    }),
    "design"
  );
});

test("แบบอนุมัติแล้วและกำลังก่อสร้างอยู่ในงานก่อสร้าง", () => {
  assert.equal(
    deriveFlowUnit({
      houseStatus: "กำลังดำเนินงาน",
      step: "เริ่มก่อสร้าง",
      designPhase: "อนุมัติ",
      openTickets: 1,
    }),
    "construction"
  );
});

test("บ้านที่เสร็จสิ้นและไม่มีเรื่องซ่อมเปิดอยู่ไปงานขาย", () => {
  assert.equal(
    deriveFlowUnit({
      houseStatus: "เสร็จสิ้น",
      step: "ส่งมอบให้ลูกค้า",
      designPhase: "อนุมัติ",
      openTickets: 0,
    }),
    "sales"
  );
});

test("บ้านที่เสร็จสิ้นและยังมีแจ้งซ่อมเปิดอยู่ไปหลังการขาย", () => {
  assert.equal(
    deriveFlowUnit({
      houseStatus: "เสร็จสิ้น",
      step: "ส่งมอบให้ลูกค้า",
      designPhase: "อนุมัติ",
      openTickets: 2,
    }),
    "aftersales"
  );
});

test("สถานะที่บันทึกไว้ทับค่าที่คำนวณจากชีต", () => {
  assert.equal(resolveFlowUnit("sales", "design"), "sales");
  assert.equal(resolveFlowUnit(undefined, "design"), "design");
});

test("ส่งต่อจากออกแบบไม่ได้จนกว่าแบบจะอนุมัติ", () => {
  const blocked = handoffChecklist({
    unit: "design",
    designPhase: "แก้ไข",
    step: "ออกแบบ",
    salesLead: "ลีด",
    handoverConfirmed: false,
    hasHandoverDoc: false,
  });
  assert.equal(blocked.next, "construction");
  assert.ok(blocked.blockers.length > 0);

  const ready = handoffChecklist({
    unit: "design",
    designPhase: "อนุมัติ",
    step: "อนุมัติแบบ",
    salesLead: "ลีด",
    handoverConfirmed: false,
    hasHandoverDoc: false,
  });
  assert.equal(ready.next, "construction");
  assert.deepEqual(ready.blockers, []);
  assert.equal(ready.stepTo, "เตรียมงาน");
});

test("ส่งต่อจากก่อสร้างได้เมื่อถึงขั้นตรวจงานก่อนนำขาย", () => {
  const blocked = handoffChecklist({
    unit: "construction",
    designPhase: "อนุมัติ",
    step: "เริ่มก่อสร้าง",
    salesLead: "ลีด",
    handoverConfirmed: false,
    hasHandoverDoc: false,
  });
  assert.equal(blocked.next, "sales");
  assert.ok(blocked.blockers.some((item) => item.includes("ตรวจงานก่อนนำขาย")));

  const ready = handoffChecklist({
    unit: "construction",
    designPhase: "อนุมัติ",
    step: "ตรวจงานก่อนนำขาย",
    salesLead: "ลีด",
    handoverConfirmed: false,
    hasHandoverDoc: false,
  });
  assert.deepEqual(ready.blockers, []);
  assert.equal(ready.stepTo, null);
});

test("ส่งต่อจากขายไปหลังการขายต้องตกลงและยืนยันส่งมอบ", () => {
  const blocked = handoffChecklist({
    unit: "sales",
    designPhase: "อนุมัติ",
    step: "ตรวจงานก่อนนำขาย",
    salesLead: "เจรจา",
    handoverConfirmed: false,
    hasHandoverDoc: false,
  });
  assert.equal(blocked.next, "aftersales");
  assert.ok(blocked.blockers.length >= 2);

  const ready = handoffChecklist({
    unit: "sales",
    designPhase: "อนุมัติ",
    step: "ส่งมอบให้ลูกค้า",
    salesLead: "ส่งมอบแล้ว",
    handoverConfirmed: false,
    hasHandoverDoc: true,
  });
  assert.deepEqual(ready.blockers, []);
  assert.equal(ready.stepTo, "หลังการขาย");
});

test("หลังการขายเป็นปลายทาง ไม่มีหน่วยถัดไป", () => {
  const end = handoffChecklist({
    unit: "aftersales",
    designPhase: null,
    step: "หลังการขาย",
    salesLead: "ส่งมอบแล้ว",
    handoverConfirmed: true,
    hasHandoverDoc: true,
  });
  assert.equal(end.next, null);
  assert.ok(end.blockers.length > 0);
});

test("เบิกวัสดุได้เฉพาะบ้านที่อยู่ในงานก่อสร้าง", () => {
  assert.equal(materialIssueAllowed("construction"), true);
  assert.equal(materialIssueAllowed("design"), false);
  assert.equal(materialIssueAllowed("sales"), false);
  assert.equal(materialIssueAllowed("aftersales"), false);
});
