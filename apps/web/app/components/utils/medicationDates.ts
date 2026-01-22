// apps/web/app/components/utils/medicationDates.ts
// Shared helpers to compute medication end date / remaining days from a free-form duration string.

export type MedicationTiming = {
  /** Parsed total duration in days; null if duration can't be parsed */
  totalDays: number | null;
  /** End date (inclusive) derived from startDate + duration; null if can't compute */
  endDate: Date | null;
  /** Whole days remaining (inclusive) from "today" to endDate; null if can't compute */
  daysRemaining: number | null;
  /** Whether endDate is before today (i.e., duration elapsed). null if can't compute */
  isExpired: boolean | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Parses human-entered duration to an integer number of days.
 * Supports strings like:
 * - "7", "7 days", "7 day", "7d"
 * - "2 weeks", "2w"
 * - "1 month", "1 months", "1m" (treated as 30 days)
 * - "3 months" (treated as 90 days)
 * Returns null if unparseable.
 */
export function parseDurationToDays(durationRaw: string | null | undefined): number | null {
  if (!durationRaw) return null;
  const duration = String(durationRaw).trim().toLowerCase();
  if (!duration) return null;

  // Common "non-duration" entries
  if (
    duration.includes("until further notice") ||
    duration.includes("indefinite") ||
    duration.includes("as needed") ||
    duration === "prn"
  ) {
    return null;
  }

  // Extract first integer found
  const numMatch = duration.match(/(\d+)/);
  if (!numMatch) return null;
  const n = Number(numMatch[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  // Unit detection
  const hasDay = /\bday\b|\bdays\b|\bd\b/.test(duration);
  const hasWeek = /\bweek\b|\bweeks\b|\bw\b/.test(duration);
  const hasMonth = /\bmonth\b|\bmonths\b|\bmo\b|\bm\b/.test(duration);

  if (hasWeek) return n * 7;
  if (hasMonth) return n * 30;
  if (hasDay) return n;

  // If no unit specified, treat as days
  return n;
}

/**
 * Computes an inclusive end date:
 * - startDate: YYYY-MM-DD or ISO string
 * - duration: free-form string
 * If duration parses to N days, endDate = start + (N-1) days (inclusive).
 */
export function computeMedicationEndDate(startDateRaw: string | null | undefined, durationRaw: string | null | undefined): Date | null {
  const totalDays = parseDurationToDays(durationRaw);
  if (!totalDays) return null;

  if (!startDateRaw) return null;
  const start = new Date(startDateRaw);
  if (Number.isNaN(start.getTime())) return null;

  const startDay = startOfDay(start);
  const end = new Date(startDay.getTime() + (totalDays - 1) * MS_PER_DAY);
  return end;
}

/**
 * Returns end date + whole days remaining (inclusive), based on today (local timezone).
 */
export function getMedicationTiming(
  startDateRaw: string | null | undefined,
  durationRaw: string | null | undefined,
  now: Date = new Date()
): MedicationTiming {
  const totalDays = parseDurationToDays(durationRaw);
  const endDate = computeMedicationEndDate(startDateRaw, durationRaw);
  if (!totalDays || !endDate) {
    return { totalDays, endDate, daysRemaining: null, isExpired: null };
  }

  const today = startOfDay(now);
  const endDay = startOfDay(endDate);
  const diffDays = Math.floor((endDay.getTime() - today.getTime()) / MS_PER_DAY);
  const daysRemaining = diffDays + 1; // inclusive
  const isExpired = daysRemaining <= 0;

  return {
    totalDays,
    endDate,
    daysRemaining: Math.max(daysRemaining, 0),
    isExpired,
  };
}



