// Shared copy for the login screen. Next 16 allows only async function
// exports in a "use server" file, so the strings live here, not in actions.ts.
export const GENERIC_LOGIN_ERROR = "Incorrect email or password";
export const EMAIL_DOMAIN_ERROR = "Email must end with @budiman.com";
export const EMPTY_FIELDS_ERROR = "Enter your email and password";
export const THROTTLE_ERROR = "Too many attempts — try again in 15 minutes";

export type SignInState = { error?: string };
