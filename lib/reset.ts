import { CHECK_KEY, LOG_KEY } from "./checklist";
import { PROPERTIES_KEY } from "./data";
import { MEDIA_KEY } from "./media";
import { TIMELINE_KEY } from "./timeline";

/** ล้างข้อมูลบ้าน / checklist / timeline / ไฟล์ / log แล้วให้ seed ใหม่ตอนโหลดครั้งถัดไป */
export function resetPropertyWorkspace() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROPERTIES_KEY);
  localStorage.removeItem(CHECK_KEY);
  localStorage.removeItem(LOG_KEY);
  localStorage.removeItem(TIMELINE_KEY);
  localStorage.removeItem(MEDIA_KEY);
}
