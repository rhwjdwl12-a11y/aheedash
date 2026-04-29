"use client";

import { useState, useRef, useEffect } from "react";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";

const CATEGORIES = ["일반", "긴급", "단국대", "아희플랜", "서정대", "개인"];

interface NewNoteModalProps {
  onClose: () => void;
}

export default function NewNoteModal({ onClose }: NewNoteModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("일반");
  const [dueLabel, setDueLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    const result = await createNote({ content: content.trim(), category, due_label: dueLabel });
    if (result?.error) {
      toast.error(result.error);
    } else {
      onClose();
    }
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(61,47,32,0.25)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          boxShadow: "0 8px 32px rgba(61,47,32,0.12)",
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="px-5 py-4" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            새 메모
          </h3>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {/* 내용 */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text-meta)", display: "block", marginBottom: 4 }}>
              내용
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 80))}
              placeholder="메모를 입력하세요..."
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm resize-none outline-none"
              style={{
                border: "0.5px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
            />
            <p style={{ fontSize: 10, color: "var(--text-meta)", textAlign: "right", marginTop: 2 }}>
              {content.length}/80
            </p>
          </div>

          {/* 카테고리 */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text-meta)", display: "block", marginBottom: 4 }}>
              카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-2.5 py-1 rounded-full text-xs transition-colors"
                  style={{
                    backgroundColor: category === cat ? "var(--text-primary)" : "var(--neutral-bg)",
                    color: category === cat ? "var(--bg-base)" : "var(--text-secondary)",
                    fontWeight: category === cat ? 500 : 400,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 마감 */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text-meta)", display: "block", marginBottom: 4 }}>
              마감 메모 (선택)
            </label>
            <input
              type="text"
              value={dueLabel}
              onChange={(e) => setDueLabel(e.target.value)}
              placeholder='예: "오늘", "내일 오전", "이번 주"'
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: "0.5px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        <div
          className="flex gap-2 px-5 py-3"
          style={{ borderTop: "0.5px solid var(--border-soft)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 rounded-md py-2 text-sm transition-colors hover:bg-[var(--neutral-bg)]"
            style={{ color: "var(--text-secondary)" }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex-1 rounded-md py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-base)",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
