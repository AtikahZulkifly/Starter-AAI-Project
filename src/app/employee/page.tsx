import Forbidden from "@/components/Forbidden";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";

export default async function EmployeeHome() {
  const user = await requireUser(["Employee"]);
  if (!user) return <Forbidden />;

  return (
    <PageCard>
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        Employee area. The leave request screens arrive with the next module.
      </p>
    </PageCard>
  );
}
