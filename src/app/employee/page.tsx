import Link from "next/link";
import FlashMessage from "@/components/FlashMessage";
import Forbidden from "@/components/Forbidden";
import LeaveList, { type LeaveRowDisplay } from "@/components/LeaveList";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import {
  EDIT_WINDOW_ERROR,
  FLASH_COPY,
  STATUS_LABELS,
  formatDateOnly,
  listForEmployee,
  workingDays,
  type LeaveStatus,
} from "@/lib/leave";

export default async function EmployeeHome({
  searchParams,
}: {
  searchParams: Promise<{ flashed?: string; blocked?: string }>;
}) {
  const user = await requireUser(["Employee"]);
  if (!user) return <Forbidden />;
  const { flashed, blocked } = await searchParams;
  // Success copy comes from the server-side whitelist, never the URL.
  const flash = flashed ? FLASH_COPY[flashed] : undefined;

  // L10: own rows only, newest first; L9 working-day count derived per row.
  const rows = await listForEmployee(user.id);
  const display: LeaveRowDisplay[] = rows.map((row) => {
    const days = workingDays(row.startDate, row.endDate);
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
      supervisorName: row.supervisor.name,
      note: row.note,
      // AC-29: an HR rejection shows the remark and the deciding officer to
      // the employee.
      remark: row.hrRemark
        ? `${row.hrRemark} — ${row.hrOfficer?.name ?? "HR"}`
        : row.supervisorRemark,
      canEdit: row.status === "PendingSupervisor",
      canCancel: row.status === "PendingSupervisor",
      canSend: row.status === "Signed",
    };
  });

  return (
    <PageCard className="max-w-5xl">
      {flash && <FlashMessage tone="success" message={flash} />}
      {blocked === "edit" && <FlashMessage message={EDIT_WINDOW_ERROR} />}
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        Employee area. Apply for leave and follow it from submission to
        decision.
      </p>
      <p className="mt-6">
        <Link
          href="/employee/leave/new"
          className="inline-block rounded-full bg-[#F5A199] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#EE8D84]"
        >
          New leave request
        </Link>
      </p>
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[#3B3837]">
          My leave requests
        </h2>
        <LeaveList rows={display} />
      </div>
    </PageCard>
  );
}
