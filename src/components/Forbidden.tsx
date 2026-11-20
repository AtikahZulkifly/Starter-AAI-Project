import Link from "next/link";
import PageCard from "@/components/PageCard";

// The shared 403 screen (design §4, look from §8). Rendered by a page when the
// role check fails — deliberately shows nothing from the refused area.
export default function Forbidden() {
  return (
    <PageCard>
      <p className="text-sm font-semibold tracking-wide text-[#A29C9A]">403</p>
      <h1 className="mt-1 text-2xl font-bold text-[#3B3837]">
        {"you don't have access to this page"}
      </h1>
      <p className="mt-4 text-sm text-[#A29C9A]">
        Your role is not allowed to open this page.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block font-medium text-[#F5A199] hover:text-[#EE8D84]"
      >
        Go to my home page
      </Link>
    </PageCard>
  );
}
