"use client";
import { useState, useRef, useEffect } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send() {
    if (!input.trim() || step >= QUESTIONS.length) return;
    const userText = input.trim();
    setMessages(m => [...m, { role: "user", text: userText }]);
    setInput("");
    const newAnswers = [...answers, userText];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        let nextQ = QUESTIONS[step + 1].replace("{name}", newAnswers[0] || "");
        setMessages(m => [...m, { role: "agent", text: nextQ }]);
        setStep(step + 1);
      } else {
        const summary = `สรุปข้อมูลลูกค้าเรียบร้อยครับ ✅\n\nชื่อ: ${newAnswers[0] || "-"}\nงบประมาณ: ${newAnswers[1] || "-"}\nทำเล: ${newAnswers[2] || "-"}\nห้องนอน: ${newAnswers[3] || "-"}\nระยะเวลา: ${newAnswers[4] || "-"}\nวัตถุประสงค์: ${newAnswers[5] || "-"}\nดูบ้านอื่นอยู่: ${newAnswers[6] || "-"}\nช่องทางติดต่อ: ${newAnswers[7] || "-"}\n\nคะแนนลีดเบื้องต้น: Warm\nทีมงานจะติดต่อกลับเพื่อนัดชมบ้านครับ`;
        setMessages(m => [...m, { role: "agent", text: summary }]);
        setStep(step + 1);
      }
    }, 500);
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-bold">Lead Agent (จำลอง LINE OA)</h1>
        <p className="text-sm text-slate-500">ทดลองคุยกับ Agent คัดกรองลีด — ถามทีละข้อ</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#7494a8]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line shadow-sm ${
              m.role === "user" ? "bg-[#06C755] text-white rounded-br-md" : "bg-white text-slate-800 rounded-bl-md"
            }`}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="พิมพ์ข้อความ..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={step >= QUESTIONS.length}
        />
        <button onClick={send} disabled={step >= QUESTIONS.length}
          className="bg-[#06C755] text-white rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40">
          ส่ง
        </button>
      </div>
    </div>
  );
}
