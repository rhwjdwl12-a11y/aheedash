import { differenceInCalendarDays, parseISO } from "date-fns";

export function calculateDday(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(deadline);
  target.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(target, today);
}

export function formatDday(deadline: string): string {
  const diff = calculateDday(deadline);
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getDdayColor(deadline: string): "urgent" | "warning" | "normal" {
  const diff = calculateDday(deadline);
  if (diff <= 3) return "urgent";
  if (diff <= 7) return "warning";
  return "normal";
}
