"use server";

import { requireUser } from "@/lib/auth";
import { resetPasswordToDemo } from "@/lib/users";
import {
  RESET_FORBIDDEN_ERROR,
  RESET_UNKNOWN_USER_ERROR,
  type ResetState,
} from "./messages";

// Rule 8: HR only, enforced here and not just by the page render. The client
// sends only a reference (userId); the row itself is re-read server-side.
export async function resetPassword(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const officer = await requireUser(["HR"]);
  if (!officer) {
    return { error: RESET_FORBIDDEN_ERROR };
  }

  const userId = Number(formData.get("userId"));
  if (!Number.isInteger(userId) || userId <= 0) {
    return { error: RESET_UNKNOWN_USER_ERROR };
  }

  const name = await resetPasswordToDemo(userId);
  if (name === null) {
    return { error: RESET_UNKNOWN_USER_ERROR };
  }
  return { message: `Password reset — ${name} can sign in with password123.` };
}
