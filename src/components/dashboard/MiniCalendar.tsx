"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  addMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { Event } from "@/types/database";

const EVENT_COLORS: Record<string, string> = {
  마감: "var(--client-aheeplan)",
  미팅: "var(--client-dankook)",
  제출: "var(--client-seojeong)",
  기타: "var(--text-meta)",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface MiniCalendarProps {
  events: Event[];
  /** 표시할 월 개수 (기본 3 = 이번달 + 2개월) */
  monthCount?: number;
}

export default function MiniCalendar({ events, monthCount = 3 }: MiniCalendarProps) {
  const today = new Date();

  // 이번달 ~ +N개월
  const months = Array.from({ length: monthCount }, (_, i) => addMonths(today, i));

  // 다가오는 일정 (오늘 이후, 표시 범위 안)
  const rangeEnd = endOfMonth(months[months.length - 1]);
  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.event_date);
      return d >= today && d <= rangeEnd;
    })
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
    >
      {months.map((m, idx) => (
        <MonthGrid key={m.toISOString()} month={m} today={today} events={events} isFirst={idx === 0} />
      ))}

      {/* 다음 일정 */}
      {upcomingEvents.length > 0 && (
        <div className="pt-3" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
          <p style={{ fontSize: 11, color: "var(--text-meta)", marginBottom: 6 }}>다가오는 일정</p>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: EVENT_COLORS[e.type] ?? EVENT_COLORS["기타"] }}
                />
                <span style={{ fontSize: 11, color: "var(--text-meta)" }}>
                  {format(new Date(e.event_date), "M/d")}
                </span>
                <span className="truncate" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {e.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  month,
  today,
  events,
  isFirst,
}: {
  month: Date;
  today: Date;
  events: Event[];
  isFirst: boolean;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const blanks = Array(startDow).fill(null);

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.event_date), day));
  }

  return (
    <div style={!isFirst ? { borderTop: "0.5px solid var(--border-soft)", paddingTop: 12 } : undefined}>
      <h3 style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 10 }}>
        {format(month, "M월 일정", { locale: ko })}
      </h3>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center"
            style={{ fontSize: 10, color: "var(--text-meta)", padding: "2px 0" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, month);

          return (
            <div
              key={day.toString()}
              className="flex flex-col items-center py-0.5 rounded"
              style={{ opacity: inMonth ? 1 : 0.3 }}
            >
              <span
                className="w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  fontSize: 11,
                  backgroundColor: isToday ? "var(--text-primary)" : "transparent",
                  color: isToday ? "var(--bg-base)" : "var(--text-secondary)",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {format(day, "d")}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: EVENT_COLORS[e.type] ?? EVENT_COLORS["기타"] }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
