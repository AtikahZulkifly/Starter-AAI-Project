import FlashMessage from "@/components/FlashMessage";
import Forbidden from "@/components/Forbidden";
import LeaveList, { type LeaveRowDisplay } from "@/components/LeaveList";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import {
  FLASH_COPY,
  STATUS_LABELS,
  formatDateOnly,
  listForSupervisor,
  workingDays,
  type LeaveStatus,
} from "@/lib/leave";

export default async function SupervisorHome({
  searchParams,
}: {
  searchParams: Promise<{ flashed?: string }>;
}) {
  const user = await requireUser(["Supervisor"]);
  if (!user) return <Forbidden />;
  const { flashed } = await searchParams;
  // Success copy comes from the server-side whitelist, never the URL.
  const flash = flashed ? FLASH_COPY[flashed] : undefined;

  // L10: every request whose named supervisor shares my division, all
  // statuses, newest first; design §12 puts the ones to sign on top.
  const rows = await listForSupervisor(user.division);
  const ordered = [
    ...rows.filter((row) => row.status === "PendingSupervisor"),
    ...rows.filter((row) => row.status !== "PendingSupervisor"),
  ];
  const display: LeaveRowDisplay[] = ordered.map((row) => {
    const days = workingDays(row.startDate, row.endDate);
    const pending = row.status === "PendingSupervisor";
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
      canSign: pending,
      canReject: pending,
    };
  });

  return (
    <PageCard className="max-w-5xl">
      {flash && <FlashMessage tone="success" message={flash} />}
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        Supervisor area. Sign or reject your division&rsquo;s requests — any
        supervisor of {user.division} may act.
      </p>
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[#3B3837]">
          Division requests
        </h2>
        <p className="mb-3 text-sm text-[#A29C9A]">
          Requests waiting for a signature are listed first.
        </p>
        <LeaveList rows={display} showEmployeeName />
      </div>
    </PageCard>
  );
}
