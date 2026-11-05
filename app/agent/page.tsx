"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOps } from "@/components/ops/useOps";
import { PageHead } from "@/components/ops/ui";
import { answerAgent } from "@/lib/agent";

type Msg = { role: "user" | "agent"; text: string; links?: { href: string; label: string }[] };

const PROMPTS = ["สรุปงานค้าง", "เสนอแผนงาน", "สต็อกใกล้หมด", "คิวช่างคนไหนแน่น", "ประวัติบ้าน 97/269"];

export default function AgentPage() {
  const { view } = useOps();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: "สวัสดีครับ ผมสรุปงานจากข้อมูลในระบบได้เลย ลองถามงานค้าง ประวัติบ้าน หรือให้ช่วยจัดแผนงาน",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function ask(text: string) {
    const question = text.trim();
    if (!question || !view || pending) return;
    setMessages((list) => [...list, { role: "user", text: question }]);
    setInput("");
    setPending(true);
    window.setTimeout(() => {
      const reply = answerAgent(question, view);
      setMessages((list) => [...list, { role: "agent", text: reply.text, links: reply.links }]);
      setPending(false);
    }, 280);
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl flex flex-col min-h-[calc(100vh-1rem)]">
      <PageHead
        title="AI Agent"
        subtitle="ตอบจากข้อมูลบ้าน สต็อก แบบ และ After-Sales ในแอป ไม่ได้ต่อโมเดลภายนอกในรอบนี้ จึงสรุปตามกฎจาก snapshot และรายการที่บันทึกไว้"
      />
      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 space-y-3 overflow-y-auto mb-3 min-h-[420px]">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-brand-600 text-white px-4 py-2 text-sm whitespace-pre-wrap"
                  : "max-w-[90%] rounded-2xl bg-slate-100 text-slate-800 px-4 py-2 text-sm whitespace-pre-wrap"
              }
            >
              {message.text}
              {message.links && message.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {message.links.map((link) => (
                    <Link key={link.href + link.label} href={link.href} className="underline text-brand-700">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && <div className="text-xs text-slate-400">กำลังดูข้อมูลในระบบ…</div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {PROMPTS.map((prompt) => (
          <button key={prompt} type="button" className="text-xs border border-slate-200 rounded-full px-3 py-1 bg-white hover:bg-slate-50" onClick={() => ask(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={view ? "ถามเรื่องงานค้าง บ้าน หรือแผนงาน" : "กำลังโหลดข้อมูล…"}
          disabled={!view}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />
        <button type="submit" disabled={!view || pending} className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50">
          ส่ง
        </button>
      </form>
    </div>
  );
}
