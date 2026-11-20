import { redirect } from "next/navigation";
import FlashMessage from "@/components/FlashMessage";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string }>;
}) {
  const { loggedOut } = await searchParams;

  // A signed-in visitor never sees the form (AC-10).
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ECE9E7] px-4 py-10">
      <div className="grid w-full max-w-[880px] overflow-hidden rounded-3xl bg-white shadow-[0_18px_45px_-20px_rgba(59,56,55,0.25)] md:grid-cols-[45%_55%]">
        {/* Picture reference panel (design §8): the illustration side of the
            agreed mock-up, CSS-cropped so its own grey matting is hidden. */}
        <div className="relative min-h-[200px] overflow-hidden bg-gradient-to-b from-[#F8C7BF] to-[#F09A90] md:min-h-full">
          {/* Pixel-probed crop of the mock-up's illustration side: the shapes
              sit at x ≈5–29%, y ≈40–77% of the 400×277 file, so this window
              hides the picture's grey matting, its own tagline text and the
              white form panel; the pink gradient fills the rest. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/auth-illustration.webp)",
              backgroundSize: "420% auto",
              backgroundPosition: "6.6% 55.1%",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="absolute left-6 top-6 text-white">
            <p className="text-sm font-semibold">Budiman HRMS</p>
            <p className="text-xs text-white/80">Leave Request module</p>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <h1 className="mb-6 text-center text-2xl font-bold text-[#3B3837]">
            Sign in
          </h1>
          {loggedOut === "1" && (
            <FlashMessage tone="success" message="You have been logged out" />
          )}
          <LoginForm />
          <p className="mt-6 text-center text-xs text-[#A29C9A]">
            {"Forgot your password? Ask HR to reset it."}
          </p>
        </div>
      </div>
    </main>
  );
}
