// Success/error banner (design §5). Presentational only — no secrets, no checks.
export default function FlashMessage({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "success";
}) {
  const look =
    tone === "error"
      ? "bg-[#C0392B]/10 text-[#C0392B]"
      : "bg-[#1E8449]/10 text-[#1E8449]";
  return (
    <p
      role="alert"
      className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium ${look}`}
    >
      {message}
    </p>
  );
}
