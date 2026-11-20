import AdminFilters from "@/components/AdminFilters";
import Forbidden from "@/components/Forbidden";
import LeaveList, { type LeaveRowDisplay } from "@/components/LeaveList";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import {
  STATUS_LABELS,
  formatDateOnly,
  listEmployeeDivisions,
  listForAdmin,
  workingDays,
  type LeaveStatus,
} from "@/lib/leave";

// A query value may arrive as string | string[]; only a whitelisted value is
// ever passed to the query, anything else means "no filter".
function one(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw : "";
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; division?: string }>;
}) {
  const user = await requireUser(["Admin"]);
  if (!user) return <Forbidden />;

  const params = await searchParams;
  const divisions = await listEmployeeDivisions();
  const status = STATUS_LABELS[params.status as LeaveStatus]
    ? one(params.status)
    : "";
  const division = divisions.includes(one(params.division))
    ? one(params.division)
    : "";

  // L10/L11: every request, newest submitted first; filters come from the URL.
  const rows = await listForAdmin(status || undefined, division || undefined);
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
      employeeName: row.employee.name,
      divisionName: row.employee.division,
      supervisorName: row.supervisor.name,
      signerName: row.signedBy?.name,
      hrOfficerName: row.hrOfficer?.name,
      note: row.note,
      remark: row.hrRemark
        ? `${row.hrRemark} — ${row.hrOfficer?.name ?? "HR"}`
        : row.supervisorRemark,
      submittedDate: formatDateOnly(row.submittedAt),
      signedDate: row.signedAt ? formatDateOnly(row.signedAt) : undefined,
      decidedDate: row.decidedAt ? formatDateOnly(row.decidedAt) : undefined,
      canEdit: false,
      canCancel: false,
    };
  });

  return (
    <PageCard className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        Admin area. Every leave request, read-only — nothing here can change
        the records.
      </p>
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[#3B3837]">
          All leave requests
        </h2>
        <AdminFilters
          status={status}
          division={division}
          statusOptions={(
            Object.entries(STATUS_LABELS) as [LeaveStatus, string][]
          ).map(([value, label]) => ({ value, label }))}
          divisionOptions={divisions}
        />
        <LeaveList rows={display} admin />
      </div>
    </PageCard>
  );
}
