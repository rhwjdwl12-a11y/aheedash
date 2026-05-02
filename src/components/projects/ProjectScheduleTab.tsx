"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/events";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import type { Event } from "@/types/database";

const EVENT_TYPES = ["미팅", "마감", "제출", "기타"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const TYPE_COLORS: Record<string, string> = {
  마감: "var(--client-aheeplan)",
  미팅: "var(--client-dankook)",
  제출: "var(--client-seojeong)",
  기타: "var(--text-meta)",
};

const DDAY_COLORS = {
  urgent: "var(--warning-text)",
  warning: "var(--client-seojeong)",
  normal: "var(--text-meta)",
};

interface ProjectScheduleTabProps {
  projectId: string;
  initialEvents: Event[];
}

export default function ProjectScheduleTab({ projectId, initialEvents }: ProjectScheduleTabProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);

  // 새 일정 폼
  const [form, setForm] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    all_day: false,
    type: "미팅" as EventType,
    memo: "",
  });

  function resetForm() {
    setForm({
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      all_day: false,
      type: "미팅",
      memo: "",
    });
  }

  async function handleAdd() {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setAdding(true);
    const eventDate = form.all_day
      ? `${form.date}T00:00:00`
      : `${form.date}T${form.time}:00`;

    const res = await createEvent({
      title: form.title.trim(),
      project_id: projectId,
      event_date: eventDate,
      all_day: form.all_day,
      type: form.type,
      memo: form.memo || undefined,
    });

    if (res?.error) toast.error(res.error);
    else {
      // 낙관적 추가 — 새 이벤트 객체 생성
      const newEvent: Event = {
        id: `temp-${Date.now()}`,
        user_id: "",
        project_id: projectId,
        title: form.title.trim(),
        event_date: eventDate,
        end_date: null,
        all_day: form.all_day,
        type: form.type,
        reminder_d3: true,
        reminder_d1: true,
        memo: form.memo || null,
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent].sort((a, b) =>
        a.event_date.localeCompare(b.event_date)
      ));
      resetForm();
      setShowForm(false);
      toast.success("일정 추가됨");
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 일정을 삭제할까요?")) return;
    const prev = events;
    setEvents((p) => p.filter((e) => e.id !== id));
    const res = await deleteEvent(id);
    if (res?.error) {
      toast.error(res.error);
      setEvents(prev);
    }
  }

  async function handleUpdateField(id: string, field: "title" | "memo", value: string) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    await updateEvent(id, { [field]: value });
  }

  async function handleChangeType(id: string, type: EventType) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, type } : e)));
    await updateEvent(id, { type });
  }

  const inputStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };

  // 시간순 정렬
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
          프로젝트 일정 ({sorted.length})
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium hover:opacity-80"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          <Plus size={12} /> {showForm ? "닫기" : "일정 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2.5"
          style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
        >
          <input
            autoFocus
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="일정 제목"
            style={{ ...inputStyle, width: "100%" }}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
            {!form.all_day && (
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={{ ...inputStyle, width: 110 }}
              />
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.all_day}
              onChange={(e) => setForm({ ...form, all_day: e.target.checked })}
              style={{ accentColor: "var(--text-primary)" }}
            />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>종일</span>
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className="px-2.5 py-1 rounded-md text-xs"
                style={{
                  backgroundColor: form.type === t ? "var(--text-primary)" : "var(--neutral-bg)",
                  color: form.type === t ? "var(--bg-base)" : "var(--text-secondary)",
                  fontWeight: form.type === t ? 500 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="메모 (선택)"
            rows={2}
            style={{ ...inputStyle, width: "100%", resize: "none" }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-3 py-1.5 rounded-md text-xs hover:bg-[var(--neutral-bg)]"
              style={{ color: "var(--text-secondary)" }}
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !form.title.trim()}
              className="px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
            >
              {adding ? "추가 중..." : "추가"}
            </button>
          </div>
        </div>
      )}

      {/* 일정 목록 */}
      {sorted.length === 0 ? (
        <div
          className="rounded-xl p-8 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: "var(--bg-surface)", border: "0.5px dashed var(--border)" }}
        >
          <Calendar size={20} style={{ color: "var(--text-meta)" }} />
          <p style={{ fontSize: 13, color: "var(--text-meta)" }}>등록된 일정이 없습니다</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((ev) => {
            const date = parseISO(ev.event_date);
            const typeColor = TYPE_COLORS[ev.type] ?? TYPE_COLORS["기타"];
            const ddayStr = formatDday(ev.event_date);
            const ddayColor = DDAY_COLORS[getDdayColor(ev.event_date)];
            return (
              <li
                key={ev.id}
                className="rounded-lg overflow-hidden flex"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "0.5px solid var(--border)",
                }}
              >
                <div style={{ width: 3, backgroundColor: typeColor }} />
                <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        defaultValue={ev.title}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== ev.title) {
                            handleUpdateField(ev.id, "title", e.target.value.trim());
                          }
                        }}
                        className="w-full bg-transparent outline-none"
                        style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}
                      />
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                          {format(date, "M/d (E)", { locale: ko })}
                          {!ev.all_day && ` ${format(date, "HH:mm")}`}
                        </span>
                        <span style={{ fontSize: 10, color: ddayColor, fontWeight: 500 }}>
                          {ddayStr}
                        </span>
                      </div>
                    </div>
                    <select
                      value={ev.type}
                      onChange={(e) => handleChangeType(ev.id, e.target.value as EventType)}
                      className="text-xs rounded px-1.5 py-0.5 outline-none shrink-0"
                      style={{
                        backgroundColor: typeColor + "22",
                        color: typeColor,
                        border: "0.5px solid " + typeColor + "44",
                        fontWeight: 500,
                      }}
                    >
                      {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1 rounded hover:bg-[var(--neutral-bg)] shrink-0"
                    >
                      <Trash2 size={12} style={{ color: "var(--text-meta)" }} />
                    </button>
                  </div>
                  <textarea
                    defaultValue={ev.memo ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (ev.memo ?? "")) {
                        handleUpdateField(ev.id, "memo", e.target.value);
                      }
                    }}
                    placeholder="메모 추가..."
                    rows={1}
                    className="w-full bg-transparent outline-none resize-none"
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
