// utils/getDateWindow.ts
export function getWeeklyWindow() {
  const today = new Date();

  // End = yesterday (inclusive)
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  // Start = 6 days before end (7 total days)
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}
