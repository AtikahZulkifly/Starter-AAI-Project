"use client";

import Link from "next/link";
import { signOut } from "@/app/login/actions";

// Top bar shown to signed-in users (design §5). It only displays identity —
// every access check happens in requireUser on the server, not here.
export default function TopBar({ name, role }: { name: string; role: string }) {
  // Rule 7: log out asks first; declining keeps the session (AC-11).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm("Are you sure you want to log out?")) {
      event.preventDefault();
    }
  }

  return (
    <header className="flex items-center justify-between bg-[#F5A199] px-6 py-3 text-white shadow-[0_6px_18px_-10px_rgba(59,56,55,0.35)]">
      <Link href="/" className="font-semibold text-white">
        Budiman HRMS
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span data-testid="user-identity">
          {name} <span className="text-white/75">({role})</span>
        </span>
        <form action={signOut} onSubmit={handleSubmit}>
          <button
            type="submit"
            className="rounded-full bg-white px-4 py-1.5 font-medium text-[#F5A199] hover:bg-[#ECE9E7]"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
