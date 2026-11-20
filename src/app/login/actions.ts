"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/session";
import { isThrottled, recordFailure } from "@/lib/throttle";
import { findUserByEmail, isBudimanEmail, normalizeEmail } from "@/lib/users";
import {
  EMPTY_FIELDS_ERROR,
  EMAIL_DOMAIN_ERROR,
  GENERIC_LOGIN_ERROR,
  THROTTLE_ERROR,
  type SignInState,
} from "./messages";

// Single-user laptops usually have no X-Forwarded-For; they share one bucket.
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  // Check the throttle first: the 6th attempt is refused even with a
  // correct password (AC-06).
  const ip = await clientIp();
  if (isThrottled(ip)) {
    return { error: THROTTLE_ERROR };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: EMPTY_FIELDS_ERROR };
  }
  // Re-checked on the server (AC-05), not just in the browser.
  if (!isBudimanEmail(email)) {
    return { error: EMAIL_DOMAIN_ERROR };
  }

  const user = await findUserByEmail(email);
  const passwordOk =
    user !== null && (await bcrypt.compare(password, user.password));
  if (!user || !passwordOk) {
    // Only credential failures are counted; format mistakes are not attempts.
    recordFailure(ip);
    return { error: GENERIC_LOGIN_ERROR };
  }

  await createSession(user.id, user.role, rememberMe);
  redirect("/");
}

export async function signOut(): Promise<never> {
  // The confirmation happened in the browser (rule 7); here we only end the
  // session and bounce to the login page with the success message (AC-11).
  await clearSession();
  redirect("/login?loggedOut=1");
}
