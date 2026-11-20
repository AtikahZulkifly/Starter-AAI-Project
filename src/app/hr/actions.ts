"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveRequest, rejectByHr } from "@/lib/leave";
import type { LeaveFormState } from "@/components/LeaveForm";

function requestId(formData: FormData): number {
  return Number(formData.get("id"));
}

// AC-28: the L8 gate (HR role + PendingHR + conditional first-decision
// update) lives in src/lib/leave.ts.
export async function hrApproveAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const result = await approveRequest(id);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/hr");
  redirect("/hr?flashed=approved");
}

// AC-29: rejection needs a non-empty remark and is final (L8/D2).
export async function hrRejectAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const id = requestId(formData);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "This request does not exist." };
  }

  const remark = formData.get("remark");
  const result = await rejectByHr(id, typeof remark === "string" ? remark : null);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/hr");
  redirect("/hr?flashed=rejected");
}
