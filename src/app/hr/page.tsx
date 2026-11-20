import Link from "next/link";
import FlashMessage from "@/components/FlashMessage";
import Forbidden from "@/components/Forbidden";
import LeaveList, { type LeaveRowDisplay } from "@/components/LeaveList";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import {
  FLASH_COPY,
  STATUS_LABELS,
  formatDateOnly,
  listForHr,
  workingDays,
  type LeaveStatus,
} from "@/lib/leave";

export default async function HrHome({
  searchParams,
}: {
  searchParams: Promise<{ flashed?: string }>;
}) {
  const user = await requireUser(["HR"]);
  if (!user) return <Forbidden />;
  const { flashed } = await searchParams;
  // Success copy comes from the server-side whitelist, never the URL.
  const flash = flashed ? FLASH_COPY[flashed] : undefined;

  // L10: HR sees every request, all statuses, newest first; design §12 puts
  // the queue (PendingHR) on top. L8: a stale decide attempt answers "already
  // been decided" — the buttons stay on the page, the server decides.
  const rows = await listForHr();
  const ordered = [
    ...rows.filter((row) => row.status === "PendingHR"),
    ...rows.filter((row) => row.status !== "PendingHR"),
  ];
  const display: LeaveRowDisplay[] = ordered.map((row) => {
    const days = workingDays(row.startDate, row.endDate);
    const waiting = row.status === "PendingHR";
    return {
      id: row.id,
      typeLabel:
        row.leaveType === "Other" && row.otherLeaveType
          ? `${row.leaveType} — ${row.otherLeaveType}`
          : row.leaveType,
      dates: `${formatDateOnly(row.startDate)} to ${formatDateOnly(row.endDate)}`,
      workingDaysText: `${days} working day${days === 1 ? "" : "s"}`,
      status: row.status,
      statusLabel: STATUS_LABELS[row.status as LeaveStatus] ?? row.status,
      employeeName: row.employee.name,
      supervisorName: row.supervisor.name,
      note: row.note,
      remark: row.supervisorRemark ?? row.hrRemark,
      canEdit: false,
      canCancel: false,
      canApprove: waiting,
      canRejectHr: waiting,
    };
  });

  return (
    <PageCard className="max-w-5xl">
      {flash && <FlashMessage tone="success" message={flash} />}
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        HR area. Approve or reject the shared queue — the first decision wins.
      </p>
      <p className="mt-4">
        <Link
          href="/hr/password-reset"
          className="font-medium text-[#F5A199] hover:text-[#EE8D84]"
        >
          Reset a password
        </Link>
      </p>
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[#3B3837]">
          HR queue
        </h2>
        <p className="mb-3 text-sm text-[#A29C9A]">
          Requests waiting for a decision are listed first.
        </p>
        <LeaveList rows={display} showEmployeeName />
      </div>
    </PageCard>
  );
}
