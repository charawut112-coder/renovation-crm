export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">ภาพรวมธุรกิจรีโนเวทบ้านเพื่อขาย</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">บ้านทั้งหมด</div>
          <div className="text-2xl font-bold text-brand-600">8</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">ลีด Hot</div>
          <div className="text-2xl font-bold text-red-500">2</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">มูลค่ารวม</div>
          <div className="text-xl font-bold text-slate-800">฿26.5M</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-slate-500">บ้านล่าช้า</div>
          <div className="text-2xl font-bold text-amber-500">1</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Pipeline Snapshot</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
          {["บ้านเข้าใหม่","นัดสำรวจ","ออกแบบ","อนุมัติแบบ","เตรียมงาน","เริ่มก่อสร้าง","ตรวจงานก่อนนำขาย","ส่งมอบให้ลูกค้า","หลังการขาย"].map((s,i) => (
            <div key={s} className="p-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-brand-600">{[1,1,1,0,1,1,1,1,1][i]}</div>
              <div className="text-slate-500 mt-1 leading-tight">{s}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-400">MVP v0.1 — ข้อมูลตัวอย่าง · ต่อ Supabase / LINE ได้ใน Phase 2</p>
    </div>
  );
}
