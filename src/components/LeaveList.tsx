"use client";

// Design §14: the shared request table row set used by the role lists. The
// server pages decide what each row may show (L10 scope, L5/L6/L7 buttons);
// this component only renders it and collects the confirmation (L12).
import { useActionState, useState } from "react";
import Link from "next/link";
import FlashMessage from "@/components/FlashMessage";
import StatusBadge from "./StatusBadge";
import { cancelRequest, sendAction } from "@/app/employee/leave/actions";
import { hrApproveAction, hrRejectAction } from "@/app/hr/actions";
import { rejectAction, signAction } from "@/app/supervisor/actions";
import type { LeaveFormState } from "./LeaveForm";

export type LeaveRowDisplay = {
  id: number;
  typeLabel: string;
  dates: string;
  workingDaysText: string;
  status: string;
  statusLabel: string;
  employeeName?: string;
  supervisorName: string;
  note: string | null;
  remark: string | null;
  canEdit: boolean;
  canCancel: boolean;
  canSend?: boolean;
  canSign?: boolean;
  canReject?: boolean;
  canApprove?: boolean;
  canRejectHr?: boolean;
  // Filled only for the admin read-only table (design §12 /admin).
  divisionName?: string;
  signerName?: string;
  hrOfficerName?: string;
  submittedDate?: string;
  signedDate?: string;
  decidedDate?: string;
};

const th = "px-2 py-2 font-medium";
const td = "px-2 py-2 align-top";
const linkLook =
  "text-sm font-medium text-[#B4544A] underline hover:no-underline disabled:opacity-50";
const dangerLook =
  "text-sm font-medium text-[#C0392B] underline hover:no-underline disabled:opacity-50";

function CancelRowButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState<LeaveFormState, FormData>(
    cancelRequest,
    {}
  );
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          // L12/AC-23: cancelling the confirmation sends nothing.
          if (!window.confirm("Cancel this request?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={pending} className={dangerLook}>
          {pending ? "Cancelling…" : "Cancel"}
        </button>
      </form>
      {state.error && <FlashMessage message={state.error} />}
    </span>
  );
}

// Design §12 /employee: Send to HR on the owner's Signed rows (L7/AC-27).
function SendToHrButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState<LeaveFormState, FormData>(
    sendAction,
    {}
  );
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <form
        action={formAction}
        onSubmit={(event) => {
          // L12/AC-34: cancelling the confirmation sends nothing.
          if (!window.confirm("Send this request to HR?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={pending} className={linkLook}>
          {pending ? "Sending…" : "Send to HR"}
        </button>
      </form>
      {state.error && <FlashMessage message={state.error} />}
    </span>
  );
}

// Design §12 /supervisor + /hr: Sign|Approve and Reject per row; Reject opens
// an inline remark field that the server checks is not empty (L6/L8/AC-26).
function DecideCell({
  id,
  variant,
}: {
  id: number;
  variant: "supervisor" | "hr";
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [signState, signFormAction, signPending] = useActionState<
    LeaveFormState,
    FormData
  >(variant === "supervisor" ? signAction : hrApproveAction, {});
  const [rejectState, rejectFormAction, rejectPending] = useActionState<
    LeaveFormState,
    FormData
  >(variant === "supervisor" ? rejectAction : hrRejectAction, {});
  const error = signState.error ?? rejectState.error;

  const positive =
    variant === "supervisor"
      ? { label: "Sign", pending: "Signing…", confirm: "Sign this request?" }
      : {
          label: "Approve",
          pending: "Approving…",
          confirm: "Approve this request?",
        };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <form
        action={signFormAction}
        onSubmit={(event) => {
          // L12/AC-34: cancelling the confirmation sends nothing.
          if (!window.confirm(positive.confirm)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={signPending} className={linkLook}>
          {signPending ? positive.pending : positive.label}
        </button>
      </form>
      {!rejectOpen && (
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          className={dangerLook}
        >
          Reject
        </button>
      )}
      {rejectOpen && (
        <form
          action={rejectFormAction}
          onSubmit={(event) => {
            if (!window.confirm("Reject this request?")) {
              event.preventDefault();
            }
          }}
          className="flex flex-col gap-1"
        >
          <input type="hidden" name="id" value={id} />
          <textarea
            name="remark"
            rows={2}
            placeholder="Reason for rejecting (required)"
            className="w-56 rounded-lg border border-[#E4DFDC] px-2.5 py-1.5 text-sm text-[#3B3837] placeholder:text-[#A29C9A] focus:outline-none focus:ring-2 focus:ring-[#F5A199]"
          />
          <button
            type="submit"
            disabled={rejectPending}
            className={dangerLook}
          >
            {rejectPending ? "Rejecting…" : "Confirm reject"}
          </button>
        </form>
      )}
      {error && <FlashMessage message={error} />}
    </span>
  );
}

export default function LeaveList({
  rows,
  showEmployeeName = false,
  admin = false,
}: {
  rows: LeaveRowDisplay[];
  showEmployeeName?: boolean;
  admin?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#A29C9A]">
        No leave requests to show here yet.
      </p>
    );
  }

  // Design §12 /admin (L11): every request, read-only — no Actions column,
  // no form, nothing that can change data.
  if (admin) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#3B3837]">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-[#A29C9A]">
              <th className={th}>Employee</th>
              <th className={th}>Division</th>
              <th className={th}>Type</th>
              <th className={th}>Dates</th>
              <th className={th}>Working days</th>
              <th className={th}>Status</th>
              <th className={th}>Remarks</th>
              <th className={th}>Supervisor</th>
              <th className={th}>Signer</th>
              <th className={th}>HR officer</th>
              <th className={th}>Submitted</th>
              <th className={th}>Signed</th>
              <th className={th}>Decided</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#ECE9E7]">
                <td className={td}>{row.employeeName}</td>
                <td className={td}>{row.divisionName}</td>
                <td className={td}>{row.typeLabel}</td>
                <td className={td}>{row.dates}</td>
                <td className={td}>{row.workingDaysText}</td>
                <td className={td}>
                  <StatusBadge status={row.status} label={row.statusLabel} />
                </td>
                <td className={td}>{row.remark ?? "—"}</td>
                <td className={td}>{row.supervisorName}</td>
                <td className={td}>{row.signerName ?? "—"}</td>
                <td className={td}>{row.hrOfficerName ?? "—"}</td>
                <td className={td}>{row.submittedDate ?? "—"}</td>
                <td className={td}>{row.signedDate ?? "—"}</td>
                <td className={td}>{row.decidedDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#3B3837]">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-[#A29C9A]">
            <th className={th}>Type</th>
            <th className={th}>Dates</th>
            <th className={th}>Working days</th>
            {showEmployeeName && <th className={th}>Employee</th>}
            <th className={th}>Supervisor</th>
            <th className={th}>Status</th>
            <th className={th}>Note</th>
            <th className={th}>Remarks</th>
            <th className={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#ECE9E7]">
              <td className={td}>{row.typeLabel}</td>
              <td className={td}>{row.dates}</td>
              <td className={td}>{row.workingDaysText}</td>
              {showEmployeeName && <td className={td}>{row.employeeName}</td>}
              <td className={td}>{row.supervisorName}</td>
              <td className={td}>
                <StatusBadge status={row.status} label={row.statusLabel} />
              </td>
              <td className={td}>{row.note ?? "—"}</td>
              <td className={td}>{row.remark ?? "—"}</td>
              <td className={td}>
                <span className="inline-flex items-start gap-3">
                  {row.canEdit && (
                    <Link
                      href={`/employee/leave/${row.id}/edit`}
                      className={linkLook}
                    >
                      Edit
                    </Link>
                  )}
                  {row.canCancel && <CancelRowButton id={row.id} />}
                  {row.canSend && <SendToHrButton id={row.id} />}
                  {(row.canSign || row.canReject) && (
                    <DecideCell id={row.id} variant="supervisor" />
                  )}
                  {(row.canApprove || row.canRejectHr) && (
                    <DecideCell id={row.id} variant="hr" />
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
