"use client";

import { useActionState } from "react";
import FlashMessage from "@/components/FlashMessage";
import { resetPassword } from "./actions";
import type { ResetState } from "./messages";

// One form per row: hidden user id only (the action re-reads the row), and
// the confirmation before the request leaves the browser (rule 7).
export default function ResetButton({
  userId,
  name,
}: {
  userId: number;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    {}
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Reset ${name}'s password to password123?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#F5A199] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#EE8D84] disabled:opacity-50"
        >
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </form>
      {state.message && <FlashMessage message={state.message} tone="success" />}
      {state.error && <FlashMessage message={state.error} />}
    </div>
  );
}
