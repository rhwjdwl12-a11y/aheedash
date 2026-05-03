"use client";

import { startOfYear, differenceInDays, getDaysInYear } from "date-fns";

interface TodayLineProps {
  year: number;
  /** 좌측 프로젝트명 컬럼 너비 (px) */
  leftOffset?: number;
}

export default function TodayLine({ year, leftOffset = 130 }: TodayLineProps) {
  const today = new Date();
  if (today.getFullYear() !== year) return null;

  const yearStart = startOfYear(today);
  const dayOfYear = differenceInDays(today, yearStart);
  const totalDays = getDaysInYear(today);
  const pct = (dayOfYear / totalDays) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-10"
      style={{
        left: `calc(${leftOffset}px + ${pct}% * (100% - ${leftOffset}px) / 100)`,
        borderLeft: "1.5px dashed var(--client-aheeplan)",
      }}
    >
      <span
        className="absolute -top-5 -translate-x-1/2 rounded"
        style={{
          fontSize: 9,
          color: "white",
          backgroundColor: "var(--client-aheeplan)",
          padding: "1px 6px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        오늘
      </span>
    </div>
  );
}
