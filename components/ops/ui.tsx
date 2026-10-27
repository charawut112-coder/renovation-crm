"use client";

import clsx from "clsx";

export function PageHead({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={clsx(
          "text-2xl font-bold mt-1",
          tone === "warn" && "text-red-600",
          tone === "good" && "text-emerald-700",
          tone === "default" && "text-slate-800"
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

const PILL: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  violet: "bg-violet-100 text-violet-800",
};

export function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: keyof typeof PILL }) {
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", PILL[tone])}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
      <div className="font-medium text-slate-700">{title}</div>
      {children && <div className="text-sm text-slate-500 mt-1">{children}</div>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        props.className
      )}
    />
  );
}

export function Btn({
  children,
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ghost" }) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50",
        tone === "primary" ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-200 bg-white hover:bg-slate-50",
        props.className
      )}
    >
      {children}
    </button>
  );
}
