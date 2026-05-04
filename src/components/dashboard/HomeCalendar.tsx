"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "@/types/database";

const EVENT_COLORS: Record<string, string> = {
  마감: "var(--client-aheeplan)",
  미팅: "var(--client-dankook)",
  제출: "var(--client-seojeong)",
  기타: "var(--text-meta)",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface HomeCalendarProps {
  events: Event[];
}

export default function HomeCalendar({ events }: HomeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function eventsOnDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.event_date), day));
  }

  function goToday() {
    setCurrentMonth(new Date());
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--border-soft)" }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
          {format(currentMonth, "M월 일정", { locale: ko })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToday}
            className="px-2.5 py-1 rounded-md hover:bg-[var(--neutral-bg)]"
            style={{ fontSize: 11, color: "var(--text-secondary)" }}
          >
            오늘
          </button>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 rounded-md hover:bg-[var(--neutral-bg)]"
          >
            <ChevronLeft size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 rounded-md hover:bg-[var(--neutral-bg)]"
          >
            <ChevronRight size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
          <span
            className="ml-1 rounded-md px-2 py-1"
            style={{
              fontSize: 11,
              border: "0.5px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            월간 ▾
          </span>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="text-center py-2"
            style={{
              fontSize: 11,
              color: i === 0 ? "var(--warning-text)" : "var(--text-meta)",
              fontWeight: 400,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const dayEvents = eventsOnDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const isSunday = day.getDay() === 0;

          return (
            <div
              key={day.toISOString()}
              className="px-2 py-2 flex flex-col gap-1"
              style={{
                minHeight: 96,
                borderRight: i % 7 !== 6 ? "0.5px solid var(--border-soft)" : undefined,
                borderTop: i >= 7 ? "0.5px solid var(--border-soft)" : undefined,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <div className="flex items-center">
                <span
                  className={isToday ? "rounded-full flex items-center justify-center" : ""}
                  style={{
                    fontSize: 12,
                    width: isToday ? 22 : "auto",
                    height: isToday ? 22 : "auto",
                    backgroundColor: isToday ? "var(--text-primary)" : "transparent",
                    color: isToday
                      ? "var(--bg-base)"
                      : isSunday
                        ? "var(--warning-text)"
                        : "var(--text-secondary)",
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* 이벤트 표시 */}
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const color = EVENT_COLORS[e.type] ?? EVENT_COLORS["기타"];
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-1 truncate"
                      title={e.title}
                    >
                      <span
                        className="rounded-full shrink-0"
                        style={{ width: 5, height: 5, backgroundColor: color }}
                      />
                      <span
                        className="truncate"
                        style={{ fontSize: 10, color: "var(--text-secondary)" }}
                      >
                        {e.title}
                      </span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: 9, color: "var(--text-meta)" }}>
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
