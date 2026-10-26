export default function PropertiesPage() {
  const rows = [
    { code: "RN-2026-001", addr: "ลาดพร้าว 15", status: "เริ่มก่อสร้าง", price: "3.2M", pct: 45 },
    { code: "RN-2026-002", addr: "รามอินทรา", status: "ตรวจงานก่อนนำขาย", price: "2.8M", pct: 95 },
    { code: "RN-2026-003", addr: "หมู่บ้านพฤกษา", status: "ออกแบบ", price: "2.1M", pct: 20 },
    { code: "RN-2026-004", addr: "สุขุมวิท 101", status: "บ้านเข้าใหม่", price: "4.1M", pct: 5 },
    { code: "RN-2026-005", addr: "พหลโยธิน", status: "ส่งมอบให้ลูกค้า", price: "2.5M", pct: 100 },
    { code: "RN-2026-006", addr: "อารีย์", status: "หลังการขาย", price: "3.8M", pct: 100 },
  ];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">บ้านทั้งหมด</h1>
      <p className="text-slate-500 mb-6 text-sm">รายการทรัพย์สินในระบบ</p>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">รหัส</th>
              <th className="text-left px-4 py-3">ที่อยู่</th>
              <th className="text-left px-4 py-3">สถานะ</th>
              <th className="text-right px-4 py-3">ต้นทุน</th>
              <th className="text-center px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.code} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-brand-600">{r.code}</td>
                <td className="px-4 py-3">{r.addr}</td>
                <td className="px-4 py-3"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{r.status}</span></td>
                <td className="px-4 py-3 text-right">{r.price}</td>
                <td className="px-4 py-3 text-center">{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
