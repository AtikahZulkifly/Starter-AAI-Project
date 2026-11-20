"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLeave, type LeaveFormInput } from "@/lib/leave";
import type { LeaveFormState } from "@/components/LeaveForm";

function text(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value !== "" ? value : null;
}

// AC-16: submit creates the PendingSupervisor row; all L3/L4 checks run in
// src/lib/leave.ts, never only in the browser.
export async function submitLeave(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const input: LeaveFormInput = {
    leaveType: text(formData, "leaveType"),
    otherLeaveType: text(formData, "otherLeaveType"),
    note: text(formData, "note"),
    startDate: text(formData, "startDate"),
    endDate: text(formData, "endDate"),
    supervisorId: text(formData, "supervisorId"),
  };

  const result = await createLeave(input);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/employee");
  redirect("/employee?flashed=submitted");
}
