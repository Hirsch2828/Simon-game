// Shows an ISO time as a Hebrew-locale date and time in the device's time zone, e.g. "22.10.2026 · 14:32"
export function formatFinishedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}
