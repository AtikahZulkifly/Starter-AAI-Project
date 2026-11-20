import { redirect } from "next/navigation";
import Forbidden from "@/components/Forbidden";
import LeaveForm from "@/components/LeaveForm";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import {
  LEAVE_TYPES,
  formatDateOnly,
  listDivisionSupervisors,
} from "@/lib/leave";
import { prisma } from "@/lib/users";
import { saveLeave } from "../../actions";

// Design §12: the same LeaveForm prefilled, only for the owner's
// PendingSupervisor rows — anything else bounces back to /employee with the
// message. The save action re-checks all of this server-side anyway (L5).
export default async function EditLeavePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["Employee"]);
  if (!user) return <Forbidden />;

  const { id } = await params;
  const rowId = Number(id);
  const row = Number.isInteger(rowId)
    ? await prisma.leaveRequest.findUnique({ where: { id: rowId } })
    : null;
  if (!row || row.employeeId !== user.id || row.status !== "PendingSupervisor") {
    redirect("/employee?blocked=edit");
  }

  const supervisors = await listDivisionSupervisors(user.division);

  return (
    <PageCard className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#3B3837]">Edit leave request</h1>
      <p className="mt-2 text-[#A29C9A]">
        Change any detail while the request is still waiting for your
        supervisor.
      </p>
      <div className="mt-6">
        <LeaveForm
          leaveTypes={LEAVE_TYPES}
          supervisors={supervisors}
          action={saveLeave}
          confirmText="Save these changes?"
          submitLabel="Save changes"
          pendingLabel="Saving…"
          hiddenFields={[{ name: "id", value: row.id }]}
          initial={{
            leaveType: row.leaveType,
            otherLeaveType: row.otherLeaveType ?? "",
            startDate: formatDateOnly(row.startDate),
            endDate: formatDateOnly(row.endDate),
            supervisorId: row.supervisorId,
            note: row.note ?? "",
          }}
        />
      </div>
    </PageCard>
  );
}
