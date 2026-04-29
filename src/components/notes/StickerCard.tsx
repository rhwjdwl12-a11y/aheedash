"use client";

import { useState, useRef, useCallback } from "react";
import { toggleNote, updateNoteContent, updateNoteColor, deleteNote } from "@/app/actions/notes";
import type { StickyNote } from "@/types/database";

const COLOR_BG: Record<StickyNote["color_key"], string> = {
  yellow: "#FFF4C2",
  pink: "#F5DDD0",
  green: "#DCE5D2",
  beige: "#E8DCC4",
  gray: "#F0EAD9",
};

const COLOR_LABELS: { key: StickyNote["color_key"]; label: string }[] = [
  { key: "yellow", label: "노랑" },
  { key: "pink", label: "핑크" },
  { key: "green", label: "초록" },
  { key: "beige", label: "베이지" },
  { key: "gray", label: "회색" },
];

const CATEGORY_COLORS: Record<string, string> = {
  단국대: "var(--client-dankook)",
  아희플랜: "var(--client-aheeplan)",
  서정대: "var(--client-seojeong)",
  긴급: "var(--warning-text)",
  개인: "var(--text-meta)",
  일반: "var(--text-meta)",
};

interface StickerCardProps {
  note: StickyNote;
}

export default function StickerCard({ note }: StickerCardProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [showMenu, setShowMenu] = useState(false);
  const [completing, setCompleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const bg = COLOR_BG[note.color_key] ?? COLOR_BG.yellow;
  const catColor = CATEGORY_COLORS[note.category ?? ""] ?? "var(--text-meta)";

  const isUrgentDue =
    note.due_label &&
    (note.due_label.includes("오늘") || note.due_label.includes("긴급"));

  async function handleToggle() {
    if (completing) return;
    setCompleting(true);
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(15);
    await toggleNote(note.id, !note.is_completed);
    setCompleting(false);
  }

  async function handleContentBlur() {
    setEditing(false);
    if (content !== note.content) {
      await updateNoteContent(note.id, content);
    }
  }

  async function handleColorChange(color_key: StickyNote["color_key"]) {
    setShowMenu(false);
    await updateNoteColor(note.id, color_key);
  }

  async function handleDelete() {
    setShowMenu(false);
    await deleteNote(note.id);
  }

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  return (
    <div className="relative">
      <div
        className="relative flex flex-col"
        style={{
          minHeight: 110,
          borderRadius: 4,
          padding: 12,
          backgroundColor: bg,
          boxShadow: "1px 2px 0 rgba(61,47,32,0.08)",
          transform: `rotate(${note.rotation}deg)`,
          opacity: note.is_completed ? 0.75 : 1,
          transition: "transform 0.15s, opacity 0.2s",
          cursor: "default",
        }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* 상단 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: catColor }}
            />
            <span style={{ fontSize: 10, color: "var(--text-meta)" }}>
              {note.category ?? "일반"}
            </span>
          </div>
          <button
            onClick={handleToggle}
            disabled={completing}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: `1.5px solid ${note.is_completed ? "var(--client-dankook)" : "var(--text-meta)"}`,
              backgroundColor: note.is_completed ? "var(--client-dankook)" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            {note.is_completed && (
              <svg width="8" height="8" viewBox="0 0 8 8">
                <path d="M1 4L3 6L7 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* 내용 */}
        {editing ? (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 80))}
            onBlur={handleContentBlur}
            maxLength={80}
            rows={3}
            className="flex-1 resize-none outline-none bg-transparent w-full"
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <p
            onClick={() => !note.is_completed && setEditing(true)}
            style={{
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--text-primary)",
              textDecoration: note.is_completed ? "line-through" : "none",
              flex: 1,
              cursor: note.is_completed ? "default" : "text",
              wordBreak: "break-word",
            }}
          >
            {note.content}
          </p>
        )}

        {/* 하단 마감 레이블 */}
        {note.due_label && (
          <p
            style={{
              fontSize: 9,
              marginTop: 6,
              color: isUrgentDue ? "var(--warning-text)" : "var(--text-meta)",
              fontWeight: isUrgentDue ? 500 : 400,
            }}
          >
            {note.due_label}
          </p>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div
            ref={menuRef}
            className="absolute top-0 right-0 z-20 rounded-lg py-1 min-w-[120px]"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              boxShadow: "0 4px 16px rgba(61,47,32,0.12)",
            }}
          >
            <p className="px-3 py-1.5 text-xs font-medium" style={{ color: "var(--text-meta)" }}>
              색상 변경
            </p>
            {COLOR_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleColorChange(key)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--neutral-bg)] transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLOR_BG[key] }}
                />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
              </button>
            ))}
            <div style={{ height: "0.5px", backgroundColor: "var(--border)", margin: "4px 0" }} />
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 hover:bg-[var(--warning-bg)] transition-colors"
              style={{ fontSize: 12, color: "var(--warning-text)" }}
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}
