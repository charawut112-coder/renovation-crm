"use client";

const scoreColor: Record<string, string> = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-slate-100 text-slate-600",
};

const customers = [
  { id: "c1", fullName: "สมชาย ใจดี", phone: "081-234-5678", email: "somchai@email.com", source: "LINE OA", leadScore: "Hot", budget: "4-5 ล้าน", preferredLocation: "บางนา, สุขุมวิท", purpose: "อยู่เอง", timeline: "ภายใน 30 วัน", interestedPropertyCode: "RN-2026-002", notes: "นัดชมบ้านแล้ว" },
  { id: "c2", fullName: "วิภา สุขใจ", phone: "089-876-5432", source: "Facebook", leadScore: "Hot", budget: "5-6 ล้าน", preferredLocation: "พญาไท", purpose: "อยู่เอง", interestedPropertyCode: "RN-2026-006" },
  { id: "c3", fullName: "อนุชา รักบ้าน", phone: "062-111-2222", source: "LINE OA", leadScore: "Warm", budget: "3-4 ล้าน", preferredLocation: "จตุจักร, ลาดพร้าว", purpose: "ลงทุน", timeline: "2-3 เดือน", interestedPropertyCode: "RN-2026-001" },
  { id: "c4", fullName: "พิมพ์ใจ ดีมาก", phone: "095-333-4444", source: "Walk-in", leadScore: "Cold", preferredLocation: "บางบัวทอง" },
];

export default function CustomersPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">ลูกค้า / ลีด (Customer 360°)</h1>
      <p className="text-slate-500 mb-6 text-sm">
        ตามสเปก: แหล่งที่มา, งบ, ทำเล, วัตถุประสงค์, บ้านที่สนใจ
      </p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium">ติดต่อ</th>
              <th className="text-left px-4 py-3 font-medium">คะแนนลีด</th>
              <th className="text-left px-4 py-3 font-medium">งบ / ทำเล</th>
              <th className="text-left px-4 py-3 font-medium">วัตถุประสงค์</th>
              <th className="text-left px-4 py-3 font-medium">แหล่งที่มา</th>
              <th className="text-left px-4 py-3 font-medium">บ้านที่สนใจ</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.fullName}</div>
                  {c.notes && <div className="text-xs text-slate-400 mt-0.5">{c.notes}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{c.phone}</div>
                  {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${scoreColor[c.leadScore]}`}>
                    {c.leadScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>{c.budget || "—"}</div>
                  <div className="text-xs text-slate-400">{c.preferredLocation || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{c.purpose || "—"}</div>
                  {c.timeline && <div className="text-xs text-slate-400">{c.timeline}</div>}
                </td>
                <td className="px-4 py-3">{c.source}</td>
                <td className="px-4 py-3 text-brand-600">{c.interestedPropertyCode || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
