// utils/aggregateDaily.ts
import { getWeeklyWindow } from "./getDateWindow"
export function fill7Days(values: Record<string, number[]>, fieldName = "value") {
  const { start } = getWeeklyWindow();
  const days: { time: string; value: number | null }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const dayKey = date.toLocaleDateString("en-GB", {
      weekday: "short", day: "2-digit", month: "short"
    });

    if (values[dayKey] && values[dayKey].length > 0) {
      const avg = values[dayKey].reduce((a, b) => a + b, 0) / values[dayKey].length;
      days.push({ time: dayKey, value: avg });
    } else {
      days.push({ time: dayKey, value: null }); // no entry
    }
  }
  return days;
}

export function aggregateDailyBloodPressure(records: any[]) {
  const daily: Record<string, { systolic: number[]; diastolic: number[] }> = {};
  records.forEach(r => {
    const day = new Date(r.createdAt).toLocaleDateString("en-GB", {
      weekday: "short", day: "2-digit", month: "short"
    });
    if (!daily[day]) daily[day] = { systolic: [], diastolic: [] };
    if (r.systolic && r.diastolic) {
      daily[day].systolic.push(r.systolic);
      daily[day].diastolic.push(r.diastolic);
    }
  });

  const { start } = getWeeklyWindow();
  const days: { time: string; systolic: number | null; diastolic: number | null }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const dayKey = date.toLocaleDateString("en-GB", {
      weekday: "short", day: "2-digit", month: "short"
    });

    if (daily[dayKey] && daily[dayKey].systolic.length > 0) {
      const avgSys = daily[dayKey].systolic.reduce((a, b) => a + b, 0) / daily[dayKey].systolic.length;
      const avgDia = daily[dayKey].diastolic.reduce((a, b) => a + b, 0) / daily[dayKey].diastolic.length;
      days.push({ time: dayKey, systolic: avgSys, diastolic: avgDia });
    } else {
      days.push({ time: dayKey, systolic: null, diastolic: null }); // no entry
    }
  }
  return days;
}
