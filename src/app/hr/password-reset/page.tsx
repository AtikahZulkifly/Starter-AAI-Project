import Forbidden from "@/components/Forbidden";
import PageCard from "@/components/PageCard";
import { requireUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import ResetButton from "./ResetButton";

export default async function PasswordResetPage() {
  const officer = await requireUser(["HR"]);
  if (!officer) return <Forbidden />;

  const users = await listUsers();

  return (
    <PageCard className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#3B3837]">Password reset</h1>
      <p className="mt-2 text-sm text-[#A29C9A]">
        Pick someone from the list — their password goes back to
        password123, hashed the same way as at seed time.
      </p>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#E4DFDC] text-xs font-medium text-[#A29C9A]">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <tr key={row.id} className="border-b border-[#E4DFDC] text-[#3B3837]">
              <td className="py-3 pr-4">{row.name}</td>
              <td className="py-3 pr-4">{row.email}</td>
              <td className="py-3 pr-4">{row.role}</td>
              <td className="py-3">
                <ResetButton userId={row.id} name={row.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageCard>
  );
}
