// Centralised Indian locale (IST) date formatters.
const TZ = "Asia/Kolkata";
const LOCALE = "en-IN";

export function formatISTDateTime(input: string | number | Date): string {
  try {
    return new Date(input).toLocaleString(LOCALE, {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(input);
  }
}

export function formatISTDate(input: string | number | Date): string {
  try {
    return new Date(input).toLocaleDateString(LOCALE, {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(input);
  }
}

export function formatISTDay(input: string | number | Date): string {
  try {
    return new Date(input).toLocaleDateString(LOCALE, {
      timeZone: TZ,
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return String(input);
  }
}
