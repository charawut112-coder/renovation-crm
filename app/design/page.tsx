"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { Btn, PageHead, Pill, TextInput } from "@/components/ops/ui";
import { CardButton, HandoffPanel, Kanban, RecentHandoffs, UnitBanner } from "@/components/units/chrome";
import { DESIGN_PHASES, type DesignPhase } from "@/lib/ops";
import { addDesignAttachment, setDesignMeta, setDesignPhase } from "@/lib/opsStore";
import { formatIsoDate } from "@/lib/format";

const TONE: Record<DesignPhase, "slate" | "blue" | "amber" | "violet" | "green"> = {
  ร่าง: "blue",
  รอตรวจ: "amber",
  แก้ไข: "violet",
  อนุมัติ: "green",
  ไม่ออกแบบ: "slate",
};

export default function DesignPage() {
  const { view, reload } = useOps();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const board = useMemo(() => {
    if (!view) return { jobs: [], loose: [], parked: 0 };
    const jobs = view.designJobs.filter((job) => {
      const house = view.houses.find((item) => item.id === job.houseId);
      if (!house) return job.phase !== "อนุมัติ" && job.phase !== "ไม่ออกแบบ";
      return house.flowUnit === "design";
    });
    const inQueue = (houseId: string) => jobs.some((job) => job.houseId === houseId);
    const loose = view.houses.filter(
      (house) => house.flowUnit === "design" && !house.duplicate && house.source === "สถานะบ้าน" && !inQueue(house.id)
    );
    const parked = view.houses.filter(
      (house) => house.flowUnit === "design" && !house.duplicate && house.source !== "สถานะบ้าน" && !inQueue(house.id)
    ).length;
    return { jobs, loose, parked };
  }, [view]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดงานออกแบบ…</div>;

  const selected = board.jobs.find((job) => job.id === openId) || null;
  const selectedHouse =
    view.houses.find((house) => house.id === (selected?.houseId || openId)) || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <UnitBanner unit="design" note="คิวแบบของบ้านที่ยังอยู่ในหน่วยงานนี้ ส่งต่องานก่อสร้างได้เมื่อแบบอนุมัติหรือระบุว่าไม่ออกแบบ" />
      <PageHead
        title="งานออกแบบ"
        subtitle="ร่าง → รอตรวจ → แก้ไข → อนุมัติ บ้านหลังเดียวกันจะหายจากบอร์ดนี้เมื่อส่งต่อไปงานก่อสร้าง"
      />
      <Kanban
        columns={DESIGN_PHASES.map((phase) => {
          const rows = board.jobs.filter((job) => job.phase === phase);
          return {
            id: phase,
            title: phase,
            isEmpty: rows.length === 0,
            empty: `ไม่มีบ้านในขั้น${phase}`,
            children: rows.map((job) => (
              <CardButton
                key={job.id}
                pressed={openId === job.id}
                onClick={() => setOpenId(job.id)}
                title={`${job.project} ${job.houseNo}`}
                meta={`${job.owner || "ไม่มีผู้รับผิดชอบ"}${job.due ? ` · ส่ง ${formatIsoDate(job.due)}` : ""}`}
                tags={
                  <>
                    <Pill tone={TONE[job.phase]}>{job.phase}</Pill>
                    {job.late && <Pill tone="red">ค้าง</Pill>}
                  </>
                }
              />
            )),
          };
        })}
      />

      {selected && (
        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={selected.houseId ? `/houses/${selected.houseId}` : "/houses"} className="font-semibold text-brand-700 hover:underline">
                {selected.project} {selected.houseNo}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                {selected.soi || "ไม่ระบุซอย"} · เริ่ม {selected.startedOn ? formatIsoDate(selected.startedOn) : "ไม่ระบุวันในชีต"} · สถานะเดิม «{selected.rawStatus || "ว่าง"}»
              </p>
              {selected.note && <p className="mt-1 text-sm text-slate-600">{selected.note}</p>}
            </div>
            <Pill tone={TONE[selected.phase]}>{selected.phase}</Pill>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">ประวัติสถานะแบบ</h3>
              <ol className="space-y-2 text-sm">
                {selected.history.map((event, index) => (
                  <li key={`${event.at}-${index}`} className="border-l-2 border-slate-200 pl-3">
                    <div className="font-medium">{event.phase}</div>
                    <div className="text-slate-600">{event.note}</div>
                    <div className="text-[11px] text-slate-500">
                      {event.by} · {event.at ? formatIsoDate(event.at.slice(0, 10)) : "—"}
                    </div>
                  </li>
                ))}
              </ol>
              <TextInput className="mt-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="บันทึกเมื่อเปลี่ยนสถานะแบบ" />
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.next.map((next) => (
                  <Btn
                    key={next}
                    type="button"
                    onClick={() => {
                      setDesignPhase(selected.id, next, note.trim() || `เปลี่ยนเป็น${next}`);
                      setNote("");
                      reload();
                    }}
                  >
                    ไป «{next}»
                  </Btn>
                ))}
                {selected.next.length === 0 && <p className="text-xs text-slate-500">สถานะแบบนี้ไปต่อในคิวออกแบบไม่ได้</p>}
              </div>
            </div>
            <DesignMeta
              jobId={selected.id}
              owner={selected.owner}
              due={selected.due}
              craftsmen={view.craftsmanNames}
              attachments={selected.attachments}
              onChange={reload}
            />
          </div>
        </article>
      )}

      {selectedHouse && (
        <div className="mt-4">
          <HandoffPanel house={selectedHouse} onDone={reload} />
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">บ้านในชีตสถานะบ้านที่ยังไม่มีใบงานออกแบบ</h2>
        {board.loose.length === 0 ? (
          <p className="text-sm text-slate-500">ไม่มีบ้านจากชีตสถานะบ้านที่รอเปิดใบงาน</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {board.loose.map((house) => (
              <CardButton
                key={house.id}
                pressed={openId === house.id}
                onClick={() => setOpenId(house.id)}
                title={house.label}
                meta={`${house.houseStatus} · ยังไม่มีแถวในชีตงานออกแบบ`}
              />
            ))}
          </div>
        )}
        {board.parked > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            อีก {board.parked} หลังอยู่ในชีตโครงการแต่ยังไม่มีสถานะบ้านหรือใบงานออกแบบ — เปิดได้จาก{" "}
            <Link href="/houses" className="text-brand-700 hover:underline">
              ทะเบียนบ้าน
            </Link>
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">ประวัติการส่งต่อที่เกี่ยวข้องกับออกแบบ</h2>
        <RecentHandoffs view={view} unit="design" />
      </section>
    </div>
  );
}

function DesignMeta({
  jobId,
  owner,
  due,
  craftsmen,
  attachments,
  onChange,
}: {
  jobId: string;
  owner: string;
  due: string;
  craftsmen: string[];
  attachments: { id: string; name: string; url: string }[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">ผู้รับผิดชอบ กำหนดส่ง และไฟล์</h3>
      <select
        className="min-h-11 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm"
        defaultValue={owner}
        aria-label="ผู้รับผิดชอบงานออกแบบ"
        onChange={(event) => {
          setDesignMeta(jobId, { owner: event.target.value });
          onChange();
        }}
      >
        <option value="">ไม่ระบุ</option>
        {craftsmen.map((person) => (
          <option key={person}>{person}</option>
        ))}
      </select>
      <label className="block text-xs text-slate-500">
        กำหนดส่ง
        <TextInput
          type="date"
          defaultValue={due}
          aria-label="กำหนดส่งงานออกแบบ"
          onChange={(event) => {
            setDesignMeta(jobId, { due: event.target.value });
            onChange();
          }}
        />
      </label>
      <ul className="space-y-1 text-sm">
        {attachments.length === 0 && <li className="text-xs text-slate-500">ไม่มีรูปในชีต</li>}
        {attachments.map((file) => (
          <li key={file.id}>
            <a href={file.url} className="text-brand-700 hover:underline" target="_blank" rel="noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
      <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อไฟล์แบบ / รูปอ้างอิง" aria-label="ชื่อไฟล์แนบ" />
      <TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" aria-label="ลิงก์ไฟล์แนบ" />
      <Btn
        type="button"
        tone="ghost"
        onClick={() => {
          if (!url.trim()) return;
          addDesignAttachment(jobId, {
            id: `att-${Date.now()}`,
            name: name || "ไฟล์แนบ",
            url: url.trim(),
            kind: "แบบ",
          });
          setUrl("");
          setName("");
          onChange();
        }}
      >
        แนบลิงก์
      </Btn>
    </div>
  );
}
