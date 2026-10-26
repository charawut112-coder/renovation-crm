export default function PipelinePage() {
  const statuses = ["บ้านเข้าใหม่","นัดสำรวจ","ออกแบบ","อนุมัติแบบ","เตรียมงาน","เริ่มก่อสร้าง","ตรวจงานก่อนนำขาย","ส่งมอบให้ลูกค้า","หลังการขาย"];
  const sample: Record<string, {code:string;addr:string}[]> = {
    "บ้านเข้าใหม่": [{code:"RN-2026-004",addr:"สุขุมวิท 101"}],
    "นัดสำรวจ": [{code:"RN-2026-008",addr:"ทองหล่อ 10"}],
    "ออกแบบ": [{code:"RN-2026-003",addr:"หมู่บ้านพฤกษา"}],
    "เตรียมงาน": [{code:"RN-2026-007",addr:"มัณฑนา"}],
    "เริ่มก่อสร้าง": [{code:"RN-2026-001",addr:"ลาดพร้าว 15"}],
    "ตรวจงานก่อนนำขาย": [{code:"RN-2026-002",addr:"รามอินทรา"}],
    "ส่งมอบให้ลูกค้า": [{code:"RN-2026-005",addr:"พหลโยธิน"}],
    "หลังการขาย": [{code:"RN-2026-006",addr:"อารีย์"}],
  };
  return (
    <div className="p-6 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-1">Pipeline</h1>
      <p className="text-slate-500 mb-6 text-sm">9 สถานะ · บ้านรีโนเวทเพื่อขาย</p>
      <div className="flex gap-3 min-w-max">
        {statuses.map(s => (
          <div key={s} className="w-56 flex-shrink-0">
            <div className="bg-brand-600 text-white text-xs font-medium px-3 py-2 rounded-t-lg">{s}</div>
            <div className="bg-slate-100 p-2 rounded-b-lg min-h-[300px] space-y-2">
              {(sample[s]||[]).map((p) => (
                <div key={p.code} className="bg-white p-3 rounded-lg shadow-sm border text-sm">
                  <div className="font-medium text-brand-600">{p.code}</div>
                  <div className="text-xs text-slate-500 mt-1">{p.addr}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
