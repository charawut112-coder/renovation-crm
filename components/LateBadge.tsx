export default function LateBadge({
  late,
  title = "งานจริงช้ากว่าแผน",
}: {
  late: boolean;
  title?: string;
}) {
  if (!late) return null;
  return (
    <span
      title={title}
      className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700"
    >
      ล่าช้า
    </span>
  );
}
