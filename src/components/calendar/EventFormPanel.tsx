"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/events";
import type { Event, Project } from "@/types/database";

const EVENT_TYPES = ["미팅", "마감", "제출", "기타"] as const;

interface EventFormPanelProps {
  projects: Project[];
  selectedDate?: string;
  editEvent?: Event | null;
  onSaved: () => void;
}

export default function EventFormPanel({
  projects,
  selectedDate,
  editEvent,
  onSaved,
}: EventFormPanelProps) {
  const [form, setForm] = useState({
    title: "",
    project_id: "",
    event_date: selectedDate ?? new Date().toISOString().slice(0, 10),
    event_time: "09:00",
    all_day: false,
    type: "미팅" as (typeof EVENT_TYPES)[number],
    reminder_d3: true,
    reminder_d1: true,
    memo: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editEvent) {
      const dt = new Date(editEvent.event_date);
      setForm({
        title: editEvent.title,
        project_id: editEvent.project_id ?? "",
        event_date: dt.toISOString().slice(0, 10),
        event_time: dt.toTimeString().slice(0, 5),
        all_day: editEvent.all_day,
        type: editEvent.type,
        reminder_d3: editEvent.reminder_d3,
        reminder_d1: editEvent.reminder_d1,
        memo: editEvent.memo ?? "",
      });
    } else if (selectedDate) {
      setForm((prev) => ({ ...prev, event_date: selectedDate }));
    }
  }, [editEvent, selectedDate]);

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요."); return; }
    setSaving(true);

    const eventDate = form.all_day
      ? `${form.event_date}T00:00:00`
      : `${form.event_date}T${form.event_time}:00`;

    const payload = {
      title: form.title,
      project_id: form.project_id || undefined,
      event_date: eventDate,
      all_day: form.all_day,
      type: form.type,
      reminder_d3: form.reminder_d3,
      reminder_d1: form.reminder_d1,
      memo: form.memo || undefined,
    };

    const result = editEvent
      ? await updateEvent(editEvent.id, payload)
      : await createEvent(payload);

    if (result?.error) toast.error(result.error);
    else onSaved();
    setSaving(false);
  }

  async function handleDelete() {
    if (!editEvent) return;
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    await deleteEvent(editEvent.id);
    onSaved();
  }

  const inputStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      className="rounded-xl flex flex-col gap-4 p-5"
      style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
        {editEvent ? "일정 편집" : "새 일정"}
      </h3>

      {/* 제목 */}
      <input
        type="text"
        placeholder="일정 제목"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        style={inputStyle}
      />

      {/* 프로젝트 */}
      <select value={form.project_id} onChange={(e) => set("project_id", e.target.value)} style={inputStyle}>
        <option value="">프로젝트 선택 (선택사항)</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>

      {/* 날짜 + 시간 */}
      <div className="flex gap-2">
        <input
          type="date"
          value={form.event_date}
          onChange={(e) => set("event_date", e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        {!form.all_day && (
          <input
            type="time"
            value={form.event_time}
            onChange={(e) => set("event_time", e.target.value)}
            style={{ ...inputStyle, width: 100 }}
          />
        )}
      </div>

      {/* 종일 토글 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.all_day}
          onChange={(e) => set("all_day", e.target.checked)}
          className="w-4 h-4 rounded"
          style={{ accentColor: "var(--text-primary)" }}
        />
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>종일</span>
      </label>

      {/* 유형 */}
      <div className="flex gap-1.5 flex-wrap">
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => set("type", t)}
            className="px-3 py-1 rounded-md text-xs transition-colors"
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

      {/* 알림 */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.reminder_d3}
            onChange={(e) => set("reminder_d3", e.target.checked)}
            style={{ accentColor: "var(--text-primary)" }}
          />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>3일 전 알림 (D-3)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.reminder_d1}
            onChange={(e) => set("reminder_d1", e.target.checked)}
            style={{ accentColor: "var(--text-primary)" }}
          />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>하루 전 알림 (D-1)</span>
        </label>
      </div>

      {/* 메모 */}
      <textarea
        placeholder="메모 (선택사항)"
        value={form.memo}
        onChange={(e) => set("memo", e.target.value)}
        rows={2}
        style={{ ...inputStyle, resize: "none" }}
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        {editEvent && (
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-md text-sm transition-colors hover:bg-[var(--warning-bg)]"
            style={{ color: "var(--warning-text)", border: "0.5px solid var(--warning-bg)" }}
          >
            삭제
          </button>
        )}
        <div className="flex gap-2 flex-1 justify-end">
          <button
            onClick={onSaved}
            className="px-4 py-2 rounded-md text-sm hover:bg-[var(--neutral-bg)]"
            style={{ color: "var(--text-secondary)" }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
