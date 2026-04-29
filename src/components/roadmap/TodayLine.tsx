"use client";

import { getDayOfYear, startOfYear, differenceInDays, getDaysInYear } from "date-fns";

interface TodayLineProps {
  year: number;
}

export default function TodayLine({ year }: TodayLineProps) {
  const today = new Date();
  if (today.getFullYear() !== year) return null;

  const yearStart = startOfYear(today);
  const dayOfYear = differenceInDays(today, yearStart);
  const totalDays = getDaysInYear(today);
  const pct = (dayOfYear / totalDays) * 100;

  // 첫 열(110px) 이후 나머지 영역에서의 위치
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-10"
      style={{
        left: `calc(110px + ${pct}% * (100% - 110px) / 100)`,
        borderLeft: "1px dashed var(--client-aheeplan)",
      }}
    >
      <span
        className="absolute -top-5 -translate-x-1/2 text-xs px-1 rounded"
        style={{
          fontSize: 9,
          color: "var(--client-aheeplan)",
          backgroundColor: "var(--bg-base)",
          whiteSpace: "nowrap",
        }}
      >
        오늘
      </span>
    </div>
  );
}
