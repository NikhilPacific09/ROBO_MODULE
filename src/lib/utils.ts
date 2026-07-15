export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
export function getDurationMinutes(inTime: string, outTime: string): number | null {
  if (!inTime || !outTime) return null;
  const [ih, im] = inTime.split(":").map(Number);
  const [oh, om] = outTime.split(":").map(Number);
  const diff = oh * 60 + om - (ih * 60 + im);
  return diff > 0 ? diff : null;
}
export function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
export function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}
