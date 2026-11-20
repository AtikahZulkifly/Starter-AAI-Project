import Link from "next/link";
import Forbidden from "@/components/Forbidden";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";

export default async function HrHome() {
  const user = await requireUser(["HR"]);
  if (!user) return <Forbidden />;

  return (
    <PageCard>
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        HR area. The shared request queue arrives with the next module.
      </p>
      {/* The reset page itself is Task 7; the link lands there. */}
      <p className="mt-6">
        <Link
          href="/hr/password-reset"
          className="font-medium text-[#F5A199] hover:text-[#EE8D84]"
        >
          Reset a password
        </Link>
      </p>
    </PageCard>
  );
}
