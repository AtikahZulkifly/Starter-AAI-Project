// The shared server-side gate behind design rules 1 and 6.
// No session (or a session whose user no longer exists) → /login.
// Logged in with the wrong role → null, so the page renders <Forbidden />.
// Every page and every server action calls this itself — the top bar is
// decoration, never the check.
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { findUserById } from "./users";

export const ROLES = ["Employee", "Supervisor", "HR", "Admin"] as const;
export type Role = (typeof ROLES)[number];

export const HOME_BY_ROLE: Record<Role, string> = {
  Employee: "/employee",
  Supervisor: "/supervisor",
  HR: "/hr",
  Admin: "/admin",
};

export async function requireUser(roles: readonly Role[]) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  // Re-read the row: a signed cookie is proof of who logged in, not that the
  // account still exists or still has this role.
  const user = await findUserById(session.uid);
  if (
    !user ||
    !(ROLES as readonly string[]).includes(user.role) ||
    user.role !== session.role
  ) {
    redirect("/login");
  }
  if (!roles.includes(user.role as Role)) {
    return null;
  }
  return user;
}
