export function parseDate(time: string): Date | null {
  if (!time) return null;
  const normalized = time.trim().replace(" ", "T");
  let d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  const num = Number(time);
  if (!isNaN(num) && num > 0) {
    d = new Date(num > 1e10 ? num : num * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function formatTime(time?: string): string {
  if (!time) return "";
  const date = parseDate(time);
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "jetzt";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("de-DE", { month: "short", day: "numeric" });
}

export function formatMsgTime(time?: string): string {
  if (!time) return "";
  const date = parseDate(time);
  if (!date) return "";
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateSeparator(time?: string): string {
  if (!time) return "Heute";
  const date = parseDate(time);
  if (!date) return "Heute";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Heute";
  if (sameDay(date, yesterday)) return "Gestern";
  return date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export function isSameDay(a: string, b: string): boolean {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return true;
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}
