"use client";

import { useState } from "react";
import StickerCard from "@/components/notes/StickerCard";
import NewNoteModal from "@/components/notes/NewNoteModal";
import type { StickyNote } from "@/types/database";

type Tab = "진행중" | "완료됨" | "보관함";

interface NotesPageClientProps {
  activeNotes: StickyNote[];
  doneNotes: StickyNote[];
  archivedNotes: StickyNote[];
}

export default function NotesPageClient({
  activeNotes,
  doneNotes,
  archivedNotes,
}: NotesPageClientProps) {
  const [tab, setTab] = useState<Tab>("진행중");
  const [showModal, setShowModal] = useState(false);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "진행중", label: "진행중", count: activeNotes.length },
    { key: "완료됨", label: "완료됨", count: doneNotes.length },
    { key: "보관함", label: "보관함", count: archivedNotes.length },
  ];

  const current =
    tab === "진행중" ? activeNotes : tab === "완료됨" ? doneNotes : archivedNotes;

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>
          메모
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          + 새 메모
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-3.5 py-1.5 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: tab === key ? "var(--text-primary)" : "var(--bg-surface)",
              color: tab === key ? "var(--bg-base)" : "var(--text-secondary)",
              border: tab === key ? "none" : "0.5px solid var(--border)",
              fontWeight: tab === key ? 500 : 400,
            }}
          >
            {label}
            <span
              className="ml-1.5 rounded-full px-1.5 py-0.5"
              style={{
                fontSize: 10,
                backgroundColor: tab === key ? "rgba(255,255,255,0.2)" : "var(--neutral-bg)",
                color: tab === key ? "var(--bg-base)" : "var(--text-meta)",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* 메모 그리드 */}
      {current.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            minHeight: 200,
            backgroundColor: "var(--bg-surface)",
            border: "0.5px solid var(--border)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-meta)" }}>메모가 없습니다</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
            gap: 12,
          }}
        >
          {current.map((note) => (
            <StickerCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {showModal && <NewNoteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
