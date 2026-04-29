"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import EventFormPanel from "./EventFormPanel";
import type { Event, Project } from "@/types/database";

const EVENT_COLORS: Record<string, string> = {
  마감: "var(--client-aheeplan)",
  미팅: "var(--client-dankook)",
  제출: "var(--client-seojeong)",
  기타: "var(--text-meta)",
};

interface CalendarClientProps {
  events: Event[];
  projects: Project[];
}

export default function CalendarClient({ events, projects }: CalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.event_date,
    end: e.end_date ?? undefined,
    allDay: e.all_day,
    backgroundColor: EVENT_COLORS[e.type] ?? EVENT_COLORS["기타"],
    borderColor: EVENT_COLORS[e.type] ?? EVENT_COLORS["기타"],
    extendedProps: { raw: e },
  }));

  function handleDateClick(info: { dateStr: string }) {
    setSelectedDate(info.dateStr);
    setEditEvent(null);
    setShowPanel(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEventClick(info: any) {
    setEditEvent(info.event.extendedProps.raw as Event);
    setSelectedDate(undefined);
    setShowPanel(true);
  }

  function handlePanelClose() {
    setShowPanel(false);
    setEditEvent(null);
    setSelectedDate(undefined);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-5">
      {/* FullCalendar */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
      >
        <style>{`
          .fc { font-family: inherit !important; }
          .fc-button {
            background: var(--bg-surface) !important;
            border: 0.5px solid var(--border) !important;
            color: var(--text-secondary) !important;
            font-size: 12px !important;
            box-shadow: none !important;
          }
          .fc-button:hover {
            background: var(--neutral-bg) !important;
          }
          .fc-button-active, .fc-button:active {
            background: var(--text-primary) !important;
            color: var(--bg-base) !important;
            border-color: var(--text-primary) !important;
          }
          .fc-day-today { background: var(--neutral-bg) !important; }
          .fc-toolbar-title { font-size: 15px !important; color: var(--text-primary) !important; font-weight: 500 !important; }
          .fc-daygrid-day-number, .fc-col-header-cell-cushion { color: var(--text-secondary) !important; font-size: 12px !important; }
          .fc-event { border-radius: 3px !important; font-size: 11px !important; }
          .fc-list-event:hover td { background: var(--neutral-bg) !important; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: var(--border-soft) !important; }
          .fc-scrollgrid { border-color: transparent !important; }
        `}</style>
        <div className="p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek",
            }}
            events={fcEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            buttonText={{
              today: "오늘",
              month: "월",
              week: "주",
              list: "목록",
            }}
          />
        </div>
      </div>

      {/* 사이드 패널 */}
      <div>
        {showPanel ? (
          <EventFormPanel
            projects={projects}
            selectedDate={selectedDate}
            editEvent={editEvent}
            onSaved={handlePanelClose}
          />
        ) : (
          <div
            className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-[var(--neutral-bg)]"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px dashed var(--border)",
              minHeight: 200,
            }}
            onClick={() => setShowPanel(true)}
          >
            <p style={{ fontSize: 18, color: "var(--text-meta)" }}>+</p>
            <p style={{ fontSize: 13, color: "var(--text-meta)" }}>날짜를 클릭하거나</p>
            <p style={{ fontSize: 13, color: "var(--text-meta)" }}>여기서 새 일정 추가</p>
          </div>
        )}
      </div>
    </div>
  );
}
