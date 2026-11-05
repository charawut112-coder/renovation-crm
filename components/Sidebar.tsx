"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  Building2,
  CalendarClock,
  ClipboardList,
  HardHat,
  Headset,
  Home,
  LayoutGrid,
  Menu,
  MessageCircle,
  Package,
  PenTool,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";

const primary = [
  { href: "/", label: "แดชบอร์ด", icon: Home },
  { href: "/houses", label: "ลูกค้าและบ้าน", icon: Building2 },
  { href: "/work", label: "สถานะงาน", icon: ClipboardList },
  { href: "/craftsmen", label: "คิวช่าง", icon: HardHat },
  { href: "/design", label: "งานออกแบบ", icon: PenTool },
  { href: "/stock", label: "สต็อกและต้นทุน", icon: Package },
  { href: "/after-sales", label: "หลังการขาย", icon: Headset },
  { href: "/agent", label: "AI Agent", icon: Bot },
];

const phase2 = [
  { href: "/pipeline", label: "Pipeline ขาย", icon: LayoutGrid },
  { href: "/properties", label: "บ้านขาย", icon: Building2 },
  { href: "/customers", label: "ลีดลูกค้า", icon: Users },
  { href: "/chat", label: "Lead Agent", icon: MessageCircle },
];

function Item({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
        active ? "bg-white text-brand-600 font-medium" : "text-brand-100 hover:bg-brand-500"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-brand-600 text-white px-4 py-3">
        <div>
          <div className="font-bold leading-tight">BUILDSPACE CRM</div>
          <div className="text-[11px] text-brand-100">รีโนเวทบ้าน · หลังการขาย</div>
        </div>
        <button type="button" aria-label="เปิดเมนู" onClick={() => setOpen(true)} className="p-2">
          <Menu size={20} />
        </button>
      </div>
      {open && <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-brand-600 text-white flex flex-col transform transition md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-brand-500 flex items-start justify-between">
          <div>
            <h1 className="font-bold text-lg leading-tight">BUILDSPACE CRM</h1>
            <p className="text-xs text-brand-100 mt-1">รีโนเวทบ้านปริมาณมาก</p>
          </div>
          <button type="button" className="md:hidden p-1" aria-label="ปิด" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {primary.map((item) => (
            <Item key={item.href} {...item} pathname={pathname} />
          ))}
          <div className="pt-3 mt-3 border-t border-brand-500 text-[11px] uppercase tracking-wide text-brand-200 px-3 flex items-center gap-1">
            <CalendarClock size={12} /> เฟสขาย
          </div>
          {phase2.map((item) => (
            <Item key={item.href} {...item} pathname={pathname} />
          ))}
        </nav>
        <div className="p-4 text-xs text-brand-200 border-t border-brand-500">MVP · ข้อมูลจากชีต</div>
      </aside>
    </>
  );
}
