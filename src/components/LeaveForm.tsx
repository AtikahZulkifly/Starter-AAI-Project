"use client";

// The shared new/edit leave form (design §14). Server component pages pass
// the leave types and own-division supervisors as props, and the server
// action — every value is re-checked server-side in src/lib/leave.ts.
import { useActionState, useState } from "react";
import FlashMessage from "@/components/FlashMessage";

export type LeaveFormState = { error?: string };
export type LeaveFormAction = (
  state: LeaveFormState,
  formData: FormData
) => Promise<LeaveFormState>;

export type LeaveFormInitial = {
  leaveType: string;
  otherLeaveType: string;
  startDate: string;
  endDate: string;
  supervisorId: number;
  note: string;
};

export default function LeaveForm({
  leaveTypes,
  supervisors,
  action,
  confirmText,
  submitLabel,
  pendingLabel,
  initial,
  hiddenFields,
}: {
  leaveTypes: readonly string[];
  supervisors: { id: number; name: string; designation: string }[];
  action: LeaveFormAction;
  confirmText: string;
  submitLabel: string;
  pendingLabel: string;
  initial?: LeaveFormInitial;
  hiddenFields?: { name: string; value: string | number }[];
}) {
  const [state, formAction, pending] = useActionState<LeaveFormState, FormData>(
    action,
    {}
  );
  // Only drives whether the Other description field is shown; the server
  // makes it required (AC-19) whatever the browser thinks.
  const [leaveType, setLeaveType] = useState<string>(
    initial?.leaveType ?? leaveTypes[0]
  );

  const field =
    "mt-1 w-full rounded-lg border border-[#E4DFDC] px-3.5 py-2.5 text-sm text-[#3B3837] placeholder:text-[#A29C9A] focus:outline-none focus:ring-2 focus:ring-[#F5A199]";

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // Rule 7 / L12: the confirmation runs first; cancelling sends
        // nothing (AC-34).
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
      className="space-y-4"
    >
      {state.error && <FlashMessage message={state.error} />}
      {hiddenFields?.map((f) => (
        <input key={f.name} type="hidden" name={f.name} value={f.value} />
      ))}
      <div>
        <label htmlFor="leaveType" className="block text-xs text-[#A29C9A]">
          Leave type
        </label>
        <select
          id="leaveType"
          name="leaveType"
          className={field}
          value={leaveType}
          onChange={(event) => setLeaveType(event.target.value)}
        >
          {leaveTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      {leaveType === "Other" && (
        <div>
          <label
            htmlFor="otherLeaveType"
            className="block text-xs text-[#A29C9A]"
          >
            What is the leave for?
          </label>
          <input
            id="otherLeaveType"
            name="otherLeaveType"
            type="text"
            required
            placeholder="Describe what the leave is for"
            className={field}
            defaultValue={initial?.otherLeaveType ?? ""}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="block text-xs text-[#A29C9A]">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className={field}
            defaultValue={initial?.startDate ?? ""}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-xs text-[#A29C9A]">
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className={field}
            defaultValue={initial?.endDate ?? ""}
          />
        </div>
      </div>
      <div>
        <label htmlFor="supervisorId" className="block text-xs text-[#A29C9A]">
          Supervisor (from your division)
        </label>
        <select
          id="supervisorId"
          name="supervisorId"
          className={field}
          defaultValue={initial?.supervisorId}
        >
          {supervisors.map((supervisor) => (
            <option key={supervisor.id} value={supervisor.id}>
              {supervisor.name} — {supervisor.designation}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="block text-xs text-[#A29C9A]">
          Note (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Anything your supervisor or HR should know"
          className={field}
          defaultValue={initial?.note ?? ""}
        />
      </div>
      <button
        type="submit"
        disabled={pending || supervisors.length === 0}
        className="rounded-full bg-[#F5A199] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#EE8D84] disabled:opacity-50"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
