"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bot,
  Building2,
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

type IconType = typeof Home;

const top = [{ href: "/", label: "แดชบอร์ด", icon: Home }];

const units: {
  id: string;
  label: string;
  href: string;
  icon: IconType;
  dot: string;
  children: { href: string; label: string; icon: IconType }[];
}[] = [
  { id: "design", label: "งานออกแบบ", href: "/design", icon: PenTool, dot: "bg-unit-design", children: [] },
  {
    id: "construction",
    label: "งานก่อสร้าง",
    href: "/construction",
    icon: HardHat,
    dot: "bg-unit-construction",
    children: [
      { href: "/work", label: "ขั้นงาน", icon: ClipboardList },
      { href: "/craftsmen", label: "คิวช่างและความคืบหน้า", icon: HardHat },
    ],
  },
  {
    id: "sales",
    label: "งานขาย",
    href: "/sales",
    icon: Users,
    dot: "bg-unit-sales",
    children: [
      { href: "/houses", label: "ลูกค้าและบ้าน", icon: Building2 },
      { href: "/customers", label: "ลีด", icon: Users },
      { href: "/pipeline", label: "ข้อตกลง", icon: LayoutGrid },
      { href: "/properties", label: "ส่งมอบ", icon: Building2 },
      { href: "/chat", label: "Lead Agent", icon: MessageCircle },
    ],
  },
  { id: "aftersales", label: "งานบริการหลังการขาย", href: "/after-sales", icon: Headset, dot: "bg-unit-aftersales", children: [] },
  { id: "stock", label: "สต็อกวัสดุและจัดซื้อ", href: "/stock", icon: Package, dot: "bg-unit-stock", children: [] },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Item({
  href,
  label,
  icon: Icon,
  pathname,
  nested,
}: {
  href: string;
  label: string;
  icon: IconType;
  pathname: string;
  nested?: boolean;
}) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
        nested && "pl-9",
        active ? "bg-white/15 text-white font-medium" : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon size={18} aria-hidden="true" />
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

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="เมนูหลัก">
      {top.map((item) => (
        <Item key={item.href} {...item} pathname={pathname} />
      ))}
      <p className="px-3 pb-1 pt-4 text-[11px] font-semibold tracking-wide text-slate-400">ห้าหน่วยงาน · บ้านหลังเดียวกัน</p>
      {units.map((unit) => {
        const childActive = unit.children.some((child) => isActive(pathname, child.href));
        const active = isActive(pathname, unit.href) || childActive;
        return (
          <div key={unit.id}>
            <Link
              href={unit.href}
              aria-current={isActive(pathname, unit.href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                active ? "bg-white/15 text-white font-medium" : "text-slate-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", unit.dot)} aria-hidden="true" />
              <unit.icon size={18} aria-hidden="true" />
              <span className="leading-snug">{unit.label}</span>
            </Link>
            {unit.children.map((child) => (
              <Item key={child.href} {...child} pathname={pathname} nested />
            ))}
          </div>
        );
      })}
      <div className="mt-3 border-t border-white/10 pt-3">
        <Item href="/agent" label="AI Agent" icon={Bot} pathname={pathname} />
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-3 text-white md:hidden">
        <div>
          <div className="font-semibold leading-tight">BUILDSPACE</div>
          <div className="text-[11px] text-slate-300">ห้าหน่วยงาน · บ้านร่วมกัน</div>
        </div>
        <button type="button" aria-label="เปิดเมนู" onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10">
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 z-40 bg-slate-900/50 md:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <h1 className="text-lg font-semibold leading-tight">BUILDSPACE</h1>
            <p className="mt-1 text-xs text-slate-400">รีโนเวทบ้าน · หนึ่งหลัง ห้าหน่วยงาน</p>
          </div>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg md:hidden" aria-label="ปิด" onClick={() => setOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {nav}
        <div className="border-t border-white/10 p-4 text-xs text-slate-400">ข้อมูลตั้งต้นจากชีต · การส่งต่อเก็บบนเครื่องนี้</div>
      </aside>
    </>
  );
}
