"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StickerCard from "./StickerCard";
import NewNoteModal from "./NewNoteModal";
import type { StickyNote } from "@/types/database";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface StickyNotesSectionProps {
  notes: StickyNote[];
}

export default function StickyNotesSection({ notes: initialNotes }: StickyNotesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState(initialNotes);

  // 새로고침 등으로 props가 갱신되면 동기화
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  function handleComplete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  const total = notes.length;
  const today = format(new Date(), "M월 d일 EEE", { locale: ko });

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* 섹션 헤더 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
                오늘의 메모
              </span>
              <span style={{ fontSize: 11, color: "var(--text-meta)", marginLeft: 8 }}>
                {today} · 할 일 {total}개
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/notes"
                className="text-xs px-2.5 py-1 rounded-md transition-colors hover:bg-[var(--neutral-bg)]"
                style={{ color: "var(--text-meta)" }}
              >
                전체
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs px-2.5 py-1 rounded-md font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
              >
                + 메모
              </button>
            </div>
          </div>
        </div>

        {/* 스티커 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
            gap: 10,
          }}
        >
          {notes.map((note) => (
            <StickerCard key={note.id} note={note} onComplete={handleComplete} />
          ))}

          {/* + 새 메모 카드 */}
          <button
            onClick={() => setShowModal(true)}
            className="flex flex-col items-center justify-center gap-1 transition-colors hover:bg-[var(--neutral-bg)]"
            style={{
              minHeight: 110,
              borderRadius: 4,
              border: "1.5px dashed var(--border)",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18, color: "var(--text-meta)" }}>+</span>
            <span style={{ fontSize: 11, color: "var(--text-meta)" }}>새 메모</span>
          </button>
        </div>
      </div>

      {showModal && <NewNoteModal onClose={() => setShowModal(false)} />}
    </>
  );
}
