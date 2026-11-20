"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelLeave,
  editLeave,
  sendToHr,
  type LeaveFormInput,
} from "@/lib/leave";
import type { LeaveFormState } from "@/components/LeaveForm";

function text(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value !== "" ? value : null;
}

function requestId(formData: FormData): number {
  return Number(formData.get("id"));
}

// AC-22: save runs the full L3/L4 re-check inside editLeave — the browser
// form state is never trusted. Owner + PendingSupervisor are re-checked too (L2, L5).
export async function saveLeave(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const input: LeaveFormInput = {
    leaveType: text(formData, "leaveType"),
    otherLeaveType: text(formData, "otherLeaveType"),
    note: text(formData, "note"),
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    supervisorId: text(formData, "supervisorId"),
  };

  const result = await editLeave(id, input);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/employee");
  redirect("/employee?flashed=saved");
}

// AC-23: the confirmation already happened in the browser (L12); this deletes
// the row — L2/L5 are enforced again in cancelLeave.
export async function cancelRequest(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const result = await cancelLeave(id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/employee");
  redirect("/employee?flashed=cancelled");
}

// AC-27: only the owner's own Signed row joins the HR queue (L7) — the
// owner + status re-check lives in sendToHr.
export async function sendAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const result = await sendToHr(id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/employee");
  redirect("/employee?flashed=sent");
}
