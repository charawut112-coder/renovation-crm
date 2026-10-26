export default function CustomersPage() {
  const rows = [
    { name: "สมชาย ใจดี", phone: "081-234-5678", score: "Hot", budget: "4-5 ล้าน", loc: "บางนา", src: "LINE" },
    { name: "วิภา สุขใจ", phone: "089-876-5432", score: "Hot", budget: "5-6 ล้าน", loc: "พญาไท", src: "Facebook" },
    { name: "อนุชา รักบ้าน", phone: "062-111-2222", score: "Warm", budget: "3-4 ล้าน", loc: "จตุจักร", src: "LINE" },
    { name: "พิมพ์ใจ ดีมาก", phone: "095-333-4444", score: "Cold", budget: "-", loc: "บางบัวทอง", src: "Walk-in" },
  ];
  const colors: Record<string,string> = { Hot: "bg-red-100 text-red-700", Warm: "bg-amber-100 text-amber-700", Cold: "bg-slate-100 text-slate-600" };
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">ลูกค้า / ลีด</h1>
      <p className="text-slate-500 mb-6 text-sm">รายชื่อลูกค้าที่สนใจซื้อบ้าน</p>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">ชื่อ</th>
              <th className="text-left px-4 py-3">เบอร์</th>
              <th className="text-left px-4 py-3">คะแนน</th>
              <th className="text-left px-4 py-3">งบ</th>
              <th className="text-left px-4 py-3">ทำเล</th>
              <th className="text-left px-4 py-3">แหล่ง</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.phone} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.phone}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[r.score]}`}>{r.score}</span></td>
                <td className="px-4 py-3">{r.budget}</td>
                <td className="px-4 py-3">{r.loc}</td>
                <td className="px-4 py-3">{r.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
