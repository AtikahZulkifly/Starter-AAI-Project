// Server-side user lookups for login and the HR reset page (design §5).
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isBudimanEmail(email: string): boolean {
  return email.endsWith("@budiman.com");
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

// The password every demo account starts with and the one HR resets return
// (design Reference B; rule 8).
export const DEMO_PASSWORD = "password123";

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { id: "asc" } });
}

// Resets one row to DEMO_PASSWORD, hashed like at seed time (cost 10).
// Returns the name of the row touched, or null when the id does not exist.
export async function resetPasswordToDemo(id: number): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(DEMO_PASSWORD, 10) },
  });
  return user.name;
}
