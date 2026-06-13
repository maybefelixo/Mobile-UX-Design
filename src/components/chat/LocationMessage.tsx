export default function LocationMessage({ position, isOwn }: { position: string; isOwn: boolean }) {
  let lat: number | null = null;
  let lon: number | null = null;
  try {
    const p = JSON.parse(position) as { lat?: number; lon?: number };
    if (typeof p.lat === "number") lat = p.lat;
    if (typeof p.lon === "number") lon = p.lon;
  } catch { /* ignore */ }

  const label = lat !== null && lon !== null
    ? `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    : position;
  const mapsUrl = lat !== null && lon !== null
    ? `https://maps.google.com/?q=${lat},${lon}`
    : null;

  return (
    <a
      href={mapsUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm",
        isOwn ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-800",
      ].join(" ")}
    >
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      <div className="min-w-0">
        <p className="text-xs font-semibold">Standort</p>
        <p className="truncate text-xs opacity-80">{label}</p>
      </div>
    </a>
  );
}
