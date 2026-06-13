export default function MessageStatus({ status }: { status?: "sending" | "error" }) {
  if (status === "sending") {
    return (
      <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l2.5 2.5" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 opacity-60" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6l4 4L13 2" />
      <path d="M7 6l4 4 6-8" />
    </svg>
  );
}
