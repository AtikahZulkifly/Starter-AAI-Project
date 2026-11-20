import type { Metadata } from "next";
import "./globals.css";
import TopBar from "@/components/TopBar";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";

export const metadata: Metadata = {
  title: "Budiman HRMS",
  description: "Leave Request module for Budiman Company.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The bar is decoration: showing it changes no rights. Every page and
  // action still calls requireUser itself (design rule 6).
  const session = await getSession();
  const user = session ? await findUserById(session.uid) : null;

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#ECE9E7] text-[#3B3837]">
        {user && <TopBar name={user.name} role={user.role} />}
        {children}
      </body>
    </html>
  );
}
