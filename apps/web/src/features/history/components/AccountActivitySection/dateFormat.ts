const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Expects "YYYY-MM-DD HH:mm[:ss]" and renders "DD Mon YYYY, HH:mm".
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;

export function formatSecondaryDate(timestamp: string): string {
  const match = TIMESTAMP_PATTERN.exec(timestamp);
  if (!match) return timestamp;

  const [, year, month, day, hour, min] = match;
  const monthName = MONTH_NAMES[Number(month) - 1] ?? month;
  return `${day} ${monthName} ${year}, ${hour}:${min}`;
}
