import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BUILDSPACE CRM | รีโนเวทบ้าน",
  description: "CRM ห้าหน่วยงานสำหรับงานรีโนเวทบ้าน ใช้ทะเบียนบ้านร่วมกัน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sans.className} min-h-screen md:flex`}>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
