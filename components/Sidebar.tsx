"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Building2,
  Users,
  MessageCircle,
  Headset,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/pipeline", label: "Pipeline", icon: LayoutGrid },
  { href: "/properties", label: "บ้านทั้งหมด", icon: Building2 },
  { href: "/customers", label: "ลูกค้า", icon: Users },
  { href: "/after-sales", label: "หลังการขาย", icon: Headset },
  { href: "/chat", label: "Lead Agent (LINE)", icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-brand-600 text-white min-h-screen flex flex-col">
      <div className="p-5 border-b border-brand-500">
        <h1 className="font-bold text-lg leading-tight">Renovation CRM</h1>
        <p className="text-xs text-brand-100 mt-1">รีโนเวทบ้านเพื่อขาย</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                active
                  ? "bg-white text-brand-600 font-medium"
                  : "text-brand-100 hover:bg-brand-500"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-brand-200 border-t border-brand-500">
        MVP v0.4 · Phase 2
      </div>
    </aside>
  );
}
