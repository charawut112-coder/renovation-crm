export default function ProgressMeter({
  progress,
  late = false,
  label,
}: {
  progress: number;
  late?: boolean;
  label?: string;
}) {
  const width = Math.max(0, Math.min(100, progress));
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${late ? "bg-red-500" : "bg-brand-500"}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{label ?? `${width}%`}</span>
    </div>
  );
}
