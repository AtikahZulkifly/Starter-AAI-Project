// The only place that touches the session cookie (design §5).
// The cookie value is a signed JSON payload: base64url(json).base64url(hmac)
// with SESSION_SECRET from .env. It holds the minimum: user id, role, expiry.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "session";
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  uid: number;
  role: string;
  exp: number; // epoch ms, also enforced server-side on every read
};

function sign(data: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — copy .env.example to .env");
  }
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export async function createSession(
  userId: number,
  role: string,
  rememberMe: boolean
): Promise<void> {
  const expiresAt = new Date(Date.now() + (rememberMe ? THIRTY_DAYS_MS : EIGHT_HOURS_MS));
  const data = Buffer.from(
    JSON.stringify({ uid: userId, role, exp: expiresAt.getTime() } satisfies SessionPayload)
  ).toString("base64url");
  const value = `${data}.${sign(data)}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    // Over localhost the browser drops Secure cookies, so it is production-only.
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const data = raw.slice(0, dot);
  const providedSig = raw.slice(dot + 1);

  const expected = Buffer.from(sign(data));
  const provided = Buffer.from(providedSig);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "number" || typeof payload.role !== "string" || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
