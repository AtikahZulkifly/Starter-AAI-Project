// Seeds the six demo people from docs/specs/02-design.md Reference B.
// Every password is the demo password, hashed here — never stored plain.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";
const BCRYPT_COST = 10;

const demoUsers = [
  { name: "Employee 1", icNumber: "00-148888", email: "employee1@budiman.com", role: "Employee", division: "Finance", designation: "Accounts Clerk" },
  { name: "Supervisor 1", icNumber: "00-157777", email: "supervisor1@budiman.com", role: "Supervisor", division: "Finance", designation: "Finance Manager" },
  { name: "Supervisor 2", icNumber: "00-166666", email: "supervisor2@budiman.com", role: "Supervisor", division: "Finance", designation: "Accountant" },
  { name: "HR 1", icNumber: "00-175555", email: "hr-1@budiman.com", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { name: "HR 2", icNumber: "00-184444", email: "hr-2@budiman.com", role: "HR", division: "Human Resources", designation: "HR Officer" },
  { name: "Admin", icNumber: "00-193333", email: "admin@budiman.com", role: "Admin", division: "Admin", designation: "Admin Manager" },
];

async function main() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);
  for (const user of demoUsers) {
    // Upsert so re-seeding restores every demo account to the original
    // fields and password (the agreed way to fix a lock-out).
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, password: hash },
      create: { ...user, password: hash },
    });
  }
  console.log(`Seeded ${demoUsers.length} demo users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
