import Forbidden from "@/components/Forbidden";
import LeaveForm from "@/components/LeaveForm";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import { LEAVE_TYPES, listDivisionSupervisors } from "@/lib/leave";
import { submitLeave } from "./actions";

export default async function NewLeaveRequestPage() {
  const user = await requireUser(["Employee"]);
  if (!user) return <Forbidden />;

  // AC-17: the dropdown lists exactly the Supervisors of the employee's
  // own division — the action re-checks the submitted id server-side.
  const supervisors = await listDivisionSupervisors(user.division);

  return (
    <PageCard className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#3B3837]">New leave request</h1>
      <p className="mt-2 text-sm text-[#A29C9A]">
        Pick your dates, choose a supervisor from your division, and add a
        note if it helps them decide.
      </p>
      <div className="mt-8">
        {supervisors.length === 0 ? (
          <p className="text-sm text-[#C0392B]">
            Your division has no supervisor yet, so requests cannot be
            submitted. Please contact HR.
          </p>
        ) : (
          <LeaveForm
            leaveTypes={LEAVE_TYPES}
            supervisors={supervisors}
            action={submitLeave}
            confirmText="Submit this leave request?"
            submitLabel="Submit"
            pendingLabel="Submitting…"
          />
        )}
      </div>
    </PageCard>
  );
}
