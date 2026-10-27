"use client";

import { useMemo, useState } from "react";
import { followupLineMessage, type FollowupItem } from "@/lib/aftersales";
import { loadProperties } from "@/lib/data";

export default function LineFollowupModal({
  item,
  onClose,
  onSubmit,
}: {
  item: FollowupItem;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const template = useMemo(() => {
    const property = loadProperties().find((entry) => entry.id === item.propertyId);
    return followupLineMessage(item, property?.address);
  }, [item]);
  const [message, setMessage] = useState(item.lineMessage || template);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">ส่ง Follow-up ทาง LINE</h3>
        <p className="text-xs text-slate-500">
          {item.propertyCode} · {item.customerName} · กำหนด {item.dueDate}
          <br />
          บันทึกข้อความนี้ในประวัติการติดต่อของลูกค้า ยังไม่ส่งออกไปที่ LINE OA
        </p>
        <label className="block text-xs text-slate-600" htmlFor="line-message">
          ข้อความ
        </label>
        <textarea
          id="line-message"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[160px]"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg">
            ยกเลิก
          </button>
          <button
            type="button"
            className="text-sm px-3 py-1.5 bg-[#06C755] text-white rounded-lg"
            onClick={() => {
              if (!message.trim()) {
                setError("กรุณาใส่ข้อความ");
                return;
              }
              onSubmit(message.trim());
            }}
          >
            บันทึกว่าส่งแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
