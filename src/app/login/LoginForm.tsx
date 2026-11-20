"use client";

import { useActionState, useState } from "react";
import FlashMessage from "@/components/FlashMessage";
import { signIn } from "./actions";
import { EMAIL_DOMAIN_ERROR, type SignInState } from "./messages";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {}
  );
  // Client-side copy of the domain rule: shown before the form is submitted.
  // The server checks it again (AC-05) — this only saves a roundtrip.
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    if (email && !email.toLowerCase().endsWith("@budiman.com")) {
      event.preventDefault();
      setClientError(EMAIL_DOMAIN_ERROR);
      return;
    }
    // Rule 7: confirm the account before the request leaves the browser.
    // Cancelling sends nothing (AC-07).
    if (!window.confirm(`Sign in as ${email}?`)) {
      event.preventDefault();
      return;
    }
    setClientError(null);
  }

  const field =
    "mt-1 w-full rounded-lg border border-[#E4DFDC] px-3.5 py-2.5 text-sm text-[#3B3837] placeholder:text-[#A29C9A] focus:outline-none focus:ring-2 focus:ring-[#F5A199]";

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {clientError && <FlashMessage message={clientError} />}
      {state.error && <FlashMessage message={state.error} />}
      <div>
        <label htmlFor="email" className="block text-xs text-[#A29C9A]">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@budiman.com"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs text-[#A29C9A]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          className={field}
        />
      </div>
      <label htmlFor="remember" className="flex items-center gap-2 text-sm text-[#A29C9A]">
        <input
          id="remember"
          name="remember"
          type="checkbox"
          className="accent-[#F5A199]"
        />
        Remember me
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#F5A199] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#EE8D84] disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
