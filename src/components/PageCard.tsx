// The shared white rounded card every app screen sits inside (design §8).
// Presentational only — access checks stay in requireUser on the server.
export default function PageCard({
  children,
  className = "max-w-2xl",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="mx-auto w-full p-8">
      <div
        className={`rounded-3xl bg-white p-10 shadow-[0_18px_45px_-20px_rgba(59,56,55,0.25)] ${className}`}
      >
        {children}
      </div>
    </main>
  );
}
