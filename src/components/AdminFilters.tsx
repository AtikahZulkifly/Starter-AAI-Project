"use client";

// Design §12 /admin (L11): the two dropdown filters are driven purely by the
// URL query — changing one pushes new search params and the server page
// re-filters. The component holds no data itself.
import { useRouter } from "next/navigation";

const selectLook =
  "rounded-lg border border-[#E4DFDC] bg-white px-2.5 py-1.5 text-sm text-[#3B3837] focus:outline-none focus:ring-2 focus:ring-[#F5A199]";

export default function AdminFilters({
  status,
  division,
  statusOptions,
  divisionOptions,
}: {
  status: string;
  division: string;
  statusOptions: { value: string; label: string }[];
  divisionOptions: string[];
}) {
  const router = useRouter();

  const apply = (nextStatus: string, nextDivision: string) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextDivision) params.set("division", nextDivision);
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  };

  return (
    <form
      className="mb-4 flex flex-wrap items-center gap-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="flex items-center gap-2 text-sm text-[#3B3837]">
        Status
        <select
          value={status}
          onChange={(event) => apply(event.target.value, division)}
          className={selectLook}
        >
          <option value="">All statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-[#3B3837]">
        Division
        <select
          value={division}
          onChange={(event) => apply(status, event.target.value)}
          className={selectLook}
        >
          <option value="">All divisions</option>
          {divisionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
