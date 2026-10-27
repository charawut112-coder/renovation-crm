"use client";

import { useState } from "react";
import { WORK_STEPS, type HouseView } from "@/lib/ops";
import { setHouseStep, setStepMeta } from "@/lib/opsStore";
import { formatIsoDate } from "@/lib/format";
import { Btn, Pill, TextInput } from "./ui";

export function StepEditor({ house, onChange }: { house: HouseView; onChange: () => void }) {
  const index = WORK_STEPS.indexOf(house.step);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = house.steps[index];

  function move(dir: -1 | 1) {
    const to = WORK_STEPS[index + dir];
    if (!to) return;
    if (dir < 0 && !note.trim()) {
      setError("ย้อนขั้นได้เมื่อระบุเหตุผล");
      return;
    }
    setError(null);
    setHouseStep({
      houseId: house.id,
      from: house.step,
      to,
      note: note.trim(),
      owner: current?.owner,
      due: current?.due,
    });
    setNote("");
    onChange();
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {house.steps.map((step) => (
          <li key={step.step} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-36 shrink-0 font-medium text-slate-800">{step.step}</span>
            {step.state === "done" && <Pill tone="green">เสร็จแล้ว</Pill>}
            {step.state === "current" && !step.late && <Pill tone="blue">กำลังทำ</Pill>}
            {step.late && <Pill tone="red">ล่าช้า</Pill>}
            {step.state === "upcoming" && <Pill>ยังไม่ถึง</Pill>}
            <span className="text-slate-500">{step.owner || "ไม่มีผู้รับผิดชอบ"}</span>
            <span className="text-slate-400">{step.due ? formatIsoDate(step.due) : "ไม่มีกำหนดส่ง"}</span>
          </li>
        ))}
      </ol>
      {current && (
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-xs text-slate-500">
            ผู้รับผิดชอบขั้นนี้
            <TextInput
              className="mt-1"
              defaultValue={current.owner}
              key={`${house.id}-${house.step}-owner`}
              onBlur={(event) => {
                setStepMeta(house.id, house.step, { owner: event.target.value });
                onChange();
              }}
            />
          </label>
          <label className="text-xs text-slate-500">
            กำหนดส่ง
            <TextInput
              className="mt-1"
              type="date"
              defaultValue={current.due}
              key={`${house.id}-${house.step}-due`}
              onChange={(event) => {
                setStepMeta(house.id, house.step, { due: event.target.value });
                onChange();
              }}
            />
          </label>
        </div>
      )}
      <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="เหตุผลเมื่อย้อนขั้น (บังคับ) หรือบันทึกสั้น ๆ" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Btn tone="ghost" type="button" disabled={index <= 0} onClick={() => move(-1)}>
          ย้อนขั้น
        </Btn>
        <Btn type="button" disabled={index >= WORK_STEPS.length - 1} onClick={() => move(1)}>
          ไปขั้นถัดไป
        </Btn>
      </div>
    </div>
  );
}
