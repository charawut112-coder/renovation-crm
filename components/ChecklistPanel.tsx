"use client";

import { useEffect, useState } from "react";
import { STATUS_CHECKLIST, isChecklistItemSatisfied, loadChecklistDone, toggleChecklistItem } from "@/lib/checklist";
import type { PropertyStatus } from "@/lib/data";
import {
  addMedia,
  checklistItemRequiresMedia,
  loadMedia,
  mediaKindForChecklistItem,
  removeMedia,
  type MediaFile,
} from "@/lib/media";

const MAX_STORED_CHARS = 480_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("ย่อรูปไม่สำเร็จ"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("เปิดรูปไม่สำเร็จ"));
    };
    img.src = url;
  });
}

async function fileToStored(file: File): Promise<{ dataUrl: string; mime: string }> {
  if (file.type.startsWith("image/")) {
    const dataUrl = file.size > 120_000 ? await resizeImage(file) : await readAsDataUrl(file);
    if (dataUrl.length > MAX_STORED_CHARS) {
      throw new Error("รูปยังใหญ่เกินไปหลังย่อ — ลองไฟล์ที่เล็กลง");
    }
    return { dataUrl, mime: dataUrl.startsWith("data:image/jpeg") ? "image/jpeg" : file.type || "image/jpeg" };
  }
  if (file.size > 350_000) {
    throw new Error("ไฟล์ใหญ่เกิน 350KB — เดโมเก็บในเบราว์เซอร์ ลองไฟล์ที่เล็กลง");
  }
  const dataUrl = await readAsDataUrl(file);
  if (dataUrl.length > MAX_STORED_CHARS) {
    throw new Error("ไฟล์ใหญ่เกินกว่าที่จะเก็บในเบราว์เซอร์");
  }
  return { dataUrl, mime: file.type || "application/octet-stream" };
}

export default function ChecklistPanel({
  propertyId,
  status,
  compact = false,
  reloadToken = 0,
  onChange,
}: {
  propertyId: string;
  status: PropertyStatus;
  compact?: boolean;
  reloadToken?: number;
  onChange?: () => void;
}) {
  const [done, setDone] = useState<string[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  function reload() {
    setDone(loadChecklistDone(propertyId));
    setFiles(loadMedia().filter((f) => f.propertyId === propertyId));
  }

  useEffect(() => {
    reload();
    // reload when the house or its stage changes, or the parent asks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, status, reloadToken]);

  const required = STATUS_CHECKLIST[status] || [];

  function notify() {
    reload();
    onChange?.();
  }

  async function onPick(item: string, list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setError(null);
    setBusyItem(item);
    try {
      const stored = await fileToStored(file);
      addMedia({
        propertyId,
        status,
        checklistItemKey: item,
        kind: mediaKindForChecklistItem(item),
        name: file.name,
        mime: stored.mime,
        dataUrl: stored.dataUrl,
      });
      notify();
    } catch (err) {
      setError(err instanceof Error ? err.message : "แนบไฟล์ไม่สำเร็จ");
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact && (
        <p className="text-xs text-slate-500">
          รายการที่เป็นเอกสารหรือรูป จะนับว่าเสร็จเมื่อมีไฟล์แนบเท่านั้น — ติ๊กอย่างเดียวไม่พอ
        </p>
      )}
      <ul className="space-y-2">
        {required.map((item) => {
          const needsFile = checklistItemRequiresMedia(item);
          const attached = files.filter(
            (f) => f.checklistItemKey === item || f.checklistItemId === item
          );
          const satisfied = isChecklistItemSatisfied(propertyId, item, done, files);
          return (
            <li key={item} className={compact ? "" : "rounded-lg border border-slate-100 p-2"}>
              {needsFile ? (
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs ${satisfied ? "text-slate-500 line-through" : "text-slate-800"}`}>
                      {item}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                        satisfied ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {satisfied ? "มีไฟล์แล้ว" : "ต้องแนบไฟล์"}
                    </span>
                  </div>
                  <label className="block">
                    <span className="sr-only">แนบไฟล์ {item}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,.txt,.doc,.docx"
                      disabled={busyItem === item}
                      className="block w-full text-[10px] text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-[10px] file:text-slate-700"
                      onChange={(e) => {
                        void onPick(item, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {attached.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-[11px] text-slate-600">
                      {f.mime.startsWith("image/") && !compact && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.dataUrl} alt={f.name} className="h-12 w-12 rounded object-cover border border-slate-200" />
                      )}
                      <a href={f.dataUrl} target="_blank" rel="noreferrer" className="truncate text-brand-600 hover:underline">
                        {f.name}
                      </a>
                      <button
                        type="button"
                        className="text-red-600 hover:underline shrink-0"
                        onClick={() => {
                          removeMedia(f.id);
                          notify();
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={done.includes(item)}
                    onChange={() => {
                      toggleChecklistItem(propertyId, item);
                      notify();
                    }}
                    className="rounded border-slate-300"
                  />
                  <span className={satisfied ? "text-slate-500 line-through" : "text-slate-700"}>{item}</span>
                </label>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
