import Forbidden from "@/components/Forbidden";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";

export default async function AdminHome() {
  const user = await requireUser(["Admin"]);
  if (!user) return <Forbidden />;

  return (
    <PageCard>
      <h1 className="text-2xl font-bold text-[#3B3837]">
        Welcome back, {user.name}
      </h1>
      <p className="mt-2 text-[#A29C9A]">
        Admin area. The view of every leave record arrives with the next module.
      </p>
    </PageCard>
  );
}
