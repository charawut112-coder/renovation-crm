import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BUILDSPACE CRM | รีโนเวทบ้าน",
  description: "AI Agent CRM สำหรับงานรีโนเวทบ้านปริมาณมากและหลังการขาย",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen md:flex">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
