const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatCapturedAt(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) {
    return null;
  }
  const hour = Number(match[4]);
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${month} ${Number(match[3])}, ${match[1]} · ${hour12}:${match[5]} ${suffix}`;
}

export function formatCaptureDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}, ${match[1]}` : value;
}

export function formatAltitude(meters: number | null): string | null {
  if (meters === null) {
    return null;
  }
  return `${Math.round(meters * 3.28084).toLocaleString("en-US")} ft`;
}

export const STOP_COLORS = ["#1b332b", "#c65a2e", "#3e6b50", "#5e5348"];

export function stopColor(takenAt: string | null, dates: string[]): string {
  const date = takenAt?.slice(0, 10) ?? "";
  const index = Math.max(0, dates.indexOf(date));
  return STOP_COLORS[index % STOP_COLORS.length] ?? STOP_COLORS[0];
}
