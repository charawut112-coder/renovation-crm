"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { Btn, Empty, PageHead, Pill, TextInput } from "@/components/ops/ui";
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
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("ทั้งหมด");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo(() => {
    if (!view) return [];
    return view.designJobs.filter((job) => {
      if (phase !== "ทั้งหมด" && job.phase !== phase) return false;
      const blob = `${job.project} ${job.houseNo} ${job.owner} ${job.note}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [view, q, phase]);

  if (!view) return <div className="p-4 sm:p-8 text-slate-500">กำลังโหลดงานออกแบบ…</div>;

  return (
    <div className="p-4 sm:p-8">
      <PageHead
        title="งานออกแบบ"
        subtitle="สถานะเดิน ร่าง → รอตรวจ → แก้ไข → อนุมัติ พร้อมประวัติ รูปจากชีตเปิดเป็นลิงก์ Drive และแนบลิงก์เพิ่มได้"
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <TextInput className="max-w-xs" placeholder="ค้นบ้านหรือผู้รับผิดชอบ" value={q} onChange={(event) => setQ(event.target.value)} />
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={phase} onChange={(event) => setPhase(event.target.value)}>
          <option>ทั้งหมด</option>
          {DESIGN_PHASES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 && <Empty title="ไม่พบงานออกแบบ" />}
      <div className="space-y-3">
        {rows.map((job) => (
          <article key={job.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={job.houseId ? `/houses/${job.houseId}` : "/houses"} className="font-medium text-brand-600 hover:underline">
                  {job.project} {job.houseNo}
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                  {job.soi || "ไม่ระบุซอย"} · เริ่ม {job.startedOn ? formatIsoDate(job.startedOn) : "ไม่ระบุวันในชีต"} · สถานะเดิม «{job.rawStatus || "ว่าง"}»
                </div>
                {job.note && <p className="text-sm text-slate-600 mt-1">{job.note}</p>}
              </div>
              <div className="flex gap-2 items-center">
                <Pill tone={TONE[job.phase]}>{job.phase}</Pill>
                {job.late && <Pill tone="red">ค้างแก้ไข</Pill>}
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              ผู้รับผิดชอบ {job.owner || "ไม่ระบุ"} · กำหนดส่ง {job.due ? formatIsoDate(job.due) : "ยังไม่ระบุ"}
            </p>
            <button type="button" className="text-xs text-brand-600 mt-2 hover:underline" onClick={() => setOpenId(openId === job.id ? null : job.id)}>
              {openId === job.id ? "ซ่อนรายละเอียด" : "ประวัติ ไฟล์แนบ และเปลี่ยนสถานะ"}
            </button>
            {openId === job.id && (
              <div className="mt-3 grid lg:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <h3 className="text-sm font-medium mb-2">ประวัติสถานะ</h3>
                  <ol className="space-y-2 text-sm">
                    {job.history.map((event, index) => (
                      <li key={`${event.at}-${index}`} className="border-l-2 border-slate-200 pl-3">
                        <div className="font-medium">{event.phase}</div>
                        <div className="text-slate-600">{event.note}</div>
                        <div className="text-[11px] text-slate-400">
                          {event.by} · {event.at ? formatIsoDate(event.at.slice(0, 10)) : "—"}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <TextInput className="mt-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="บันทึกประวัติเมื่อเปลี่ยนสถานะ" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.next.map((next) => (
                      <Btn
                        key={next}
                        type="button"
                        onClick={() => {
                          setDesignPhase(job.id, next, note.trim() || `เปลี่ยนเป็น${next}`);
                          setNote("");
                          reload();
                        }}
                      >
                        ไป «{next}»
                      </Btn>
                    ))}
                    {job.next.length === 0 && <p className="text-xs text-slate-500">สถานะนี้ไปต่อไม่ได้</p>}
                  </div>
                </div>
                <DesignMeta jobId={job.id} owner={job.owner} due={job.due} craftsmen={view.craftsmanNames} onChange={reload} attachments={job.attachments} />
              </div>
            )}
          </article>
        ))}
      </div>
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
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        defaultValue={owner}
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
      <TextInput
        type="date"
        defaultValue={due}
        onChange={(event) => {
          setDesignMeta(jobId, { due: event.target.value });
          onChange();
        }}
      />
      <ul className="text-sm space-y-1">
        {attachments.length === 0 && <li className="text-slate-400 text-xs">ไม่มีรูปในชีต</li>}
        {attachments.map((file) => (
          <li key={file.id}>
            <a href={file.url} className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
      <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อไฟล์แบบ / รูปอ้างอิง" />
      <TextInput value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
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
