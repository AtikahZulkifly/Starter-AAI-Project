"use client";

// Design §14: Reference D labels as a small coloured pill. The label text is
// passed in from the server (single home: STATUS_LABELS in src/lib/leave.ts);
// only the colours live here.
const PILL_BY_STATUS: Record<string, string> = {
  PendingSupervisor: "bg-[#FEF3D9] text-[#8A6116]",
  Signed: "bg-[#E7EFF7] text-[#2C5F8A]",
  PendingHR: "bg-[#FEF3D9] text-[#8A6116]",
  Approved: "bg-[#E4F2E0] text-[#3E7A3B]",
  RejectedBySupervisor: "bg-[#F3DEDE] text-[#9A3A3A]",
  RejectedByHR: "bg-[#F3DEDE] text-[#9A3A3A]",
};

export default function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const tone = PILL_BY_STATUS[status] ?? "bg-[#ECE9E7] text-[#3B3837]";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
