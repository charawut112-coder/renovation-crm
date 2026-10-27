"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { appendContact } from "@/lib/contacts";
import { addCustomer, buildCustomerFromChat, matchPropertyCode, type Customer } from "@/lib/customers";
import { linkCustomerIfUnassigned, loadProperties } from "@/lib/data";

const QUESTIONS = [
  "ขอทราบชื่อหน่อยได้ไหมครับ",
  "ขอบคุณครับคุณ{name}\nของบประมาณที่ตั้งไว้ประมาณเท่าไหร่ครับ?",
  "รับทราบครับ\nทำเลที่สนใจเป็นพิเศษมีไหมครับ?",
  "ต้องการบ้านกี่ห้องนอนโดยประมาณครับ?",
  "วางแผนจะซื้อภายในช่วงไหนครับ?",
  "ซื้อไว้ทำเองหรือซื้อเพื่อลงทุนครับ?",
  "ตอนนี้มีบ้านหลังอื่นที่กำลังดูอยู่ด้วยไหมครับ?",
  "สะดวกให้ติดต่อกลับทาง LINE หรือโทรดีกว่าครับ?",
];

type Msg = { role: "user" | "agent"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "agent", text: "สวัสดีครับ สนใจบ้านรีโนเวทของเราใช่ไหมครับ?\nขอทราบชื่อหน่อยได้ไหมครับ 😊" },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [saved, setSaved] = useState<Customer | null>(null);
  const [savedCode, setSavedCode] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, saved]);

  function send() {
    if (sending.current || !input.trim() || step >= QUESTIONS.length) return;
    sending.current = true;
    const userText = input.trim();
    const newAnswers = [...answers, userText];
    const nextStep = step + 1;
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setAnswers(newAnswers);
    setStep(nextStep);

    window.setTimeout(() => {
      if (nextStep < QUESTIONS.length) {
        sending.current = false;
        const nextQ = QUESTIONS[nextStep].replace("{name}", newAnswers[0] || "");
        setMessages((m) => [...m, { role: "agent", text: nextQ }]);
        return;
      }
      const draft = buildCustomerFromChat(newAnswers);
      const properties = loadProperties();
      const code = matchPropertyCode(draft.preferredLocation || "", properties);
      if (code) draft.interestedPropertyCode = code;
      const customer = addCustomer(draft);
      if (code) linkCustomerIfUnassigned(code, customer);
      appendContact({
        customerId: customer.id,
        channel: "LINE",
        summary: `คัดกรองลีดผ่าน Lead Agent · งบ ${customer.budget || "-"} · ทำเล ${customer.preferredLocation || "-"}`,
        propertyCode: code,
        by: "Lead Agent",
      });
      setSaved(customer);
      setSavedCode(code);
      const summary = [
        "สรุปข้อมูลลูกค้าเรียบร้อยครับ ✅",
        "",
        `ชื่อ: ${customer.fullName}`,
        `งบประมาณ: ${customer.budget || "-"}`,
        `ทำเล: ${customer.preferredLocation || "-"}`,
        `ห้องนอน: ${newAnswers[3] || "-"}`,
        `ระยะเวลา: ${customer.timeline || "-"}`,
        `วัตถุประสงค์: ${customer.purpose || "-"}`,
        `ดูบ้านอื่นอยู่: ${newAnswers[6] || "-"}`,
        `ช่องทางติดต่อ: ${newAnswers[7] || "-"}`,
        "",
        "คะแนนลีดเบื้องต้น: Warm",
        code ? `สนใจบ้าน: ${code}` : "ยังจับคู่บ้านที่สนใจไม่ได้จากทำเลที่บอก",
        "บันทึกเป็นลูกค้าในระบบแล้ว — ทีมงานจะติดต่อกลับเพื่อนัดชมบ้านครับ",
      ].join("\n");
      setMessages((m) => [...m, { role: "agent", text: summary }]);
    }, 500);
  }

  const finished = step >= QUESTIONS.length;

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold">Lead Agent (จำลอง LINE OA)</h1>
        <p className="text-sm text-slate-500">ทดลองคุยกับ Agent คัดกรองลีด — ถามทีละข้อ แล้วบันทึกเป็นลูกค้า</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#7494a8]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line shadow-sm ${
                m.role === "user" ? "bg-[#06C755] text-white rounded-br-md" : "bg-white text-slate-800 rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {saved && (
          <div className="flex justify-start">
            <Link
              href={`/customers/${saved.id}`}
              className="bg-white text-brand-600 text-sm font-medium px-4 py-2 rounded-2xl shadow-sm hover:underline"
            >
              เปิดแฟ้มลูกค้า {saved.fullName}
              {savedCode ? ` · ${savedCode}` : ""}
            </Link>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="พิมพ์ข้อความ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={finished}
        />
        <button
          onClick={send}
          disabled={finished}
          className="bg-[#06C755] text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}
