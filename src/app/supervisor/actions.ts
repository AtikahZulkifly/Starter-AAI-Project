"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rejectBySupervisor, signRequest } from "@/lib/leave";
import type { LeaveFormState } from "@/components/LeaveForm";

function requestId(formData: FormData): number {
  return Number(formData.get("id"));
}

// AC-24/AC-25: the L6 gate (division supervisor + PendingSupervisor) lives in
// src/lib/leave.ts — this file only moves the form data there.
export async function signAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const result = await signRequest(id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/supervisor");
  redirect("/supervisor?flashed=signed");
}

// AC-26: the remark is required and the rejection is final (L6/D2).
export async function rejectAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const remark = formData.get("remark");
  const result = await rejectBySupervisor(
    id,
    typeof remark === "string" ? remark : null
  );
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/supervisor");
  redirect("/supervisor?flashed=rejected");
}
