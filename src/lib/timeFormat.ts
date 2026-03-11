/**
 * Format a 24h time string (HH:mm) to 12-hour format (h:mm AM/PM)
 */
export function formatTime12h(time: string | null | undefined): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range in 12h format
 */
export function formatTimeRange12h(start: string | null | undefined, end: string | null | undefined): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}
