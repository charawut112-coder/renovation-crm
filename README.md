# Renovation CRM — AI Agent CRM สำหรับรีโนเวทบ้านเพื่อขาย

MVP Web App สำหรับธุรกิจรีโนเวทบ้านเพื่อขาย รองรับปริมาณงาน >10 หลัง/เดือน

## ฟีเจอร์ใน MVP

- **Dashboard** — ภาพรวม Pipeline, ลีด Hot, บ้านล่าช้า
- **Pipeline** — Kanban 9 สถานะ (บ้านเข้าใหม่ → หลังการขาย)
- **บ้านทั้งหมด** — ตารางทรัพย์สิน + Progress
- **ลูกค้า** — รายชื่อลีด + คะแนน Hot/Warm/Cold
- **Lead Agent (LINE)** — จำลองแชทคัดกรองลีดตาม System Prompt จริง

## รันท้องถิ่น

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- TypeScript
- Mock data (พร้อมต่อ Supabase / LINE Messaging API)
