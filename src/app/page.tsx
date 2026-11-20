// "/": signed in → own role home, signed out → /login (design §4).
import { redirect } from "next/navigation";
import { HOME_BY_ROLE, ROLES, type Role } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session || !(ROLES as readonly string[]).includes(session.role)) {
    redirect("/login");
  }
  redirect(HOME_BY_ROLE[session.role as Role]);
}
