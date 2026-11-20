// Shared strings and state shape for the reset form. Kept out of actions.ts
// because a "use server" file may only export async functions (Next 16).
export type ResetState = { message?: string; error?: string };

export const RESET_UNKNOWN_USER_ERROR =
  "Unknown user — pick someone from the list.";
export const RESET_FORBIDDEN_ERROR =
  "Only HR can reset passwords.";
