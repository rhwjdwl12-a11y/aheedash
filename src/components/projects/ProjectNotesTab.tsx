"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/projects";

interface ProjectNotesTabProps {
  projectId: string;
  initialNotes: string | null;
}

export default function ProjectNotesTab({ projectId, initialNotes }: ProjectNotesTabProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (notes === saved) return;
    setSaving(true);
    const res = await updateProject(projectId, { notes });
    if (res?.error) toast.error(res.error);
    else {
      setSaved(notes);
      toast.success("저장됨");
    }
    setSaving(false);
  }

  const dirty = notes !== saved;

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
        minHeight: 360,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "0.5px solid var(--border-soft)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
          프로젝트 메모
        </p>
        <div className="flex items-center gap-2">
          {dirty && (
            <span style={{ fontSize: 10, color: "var(--text-meta)" }}>
              저장되지 않은 변경사항
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-md px-3 py-1 text-xs font-medium hover:opacity-80 disabled:opacity-40"
            style={{
              backgroundColor: dirty ? "var(--text-primary)" : "var(--neutral-bg)",
              color: dirty ? "var(--bg-base)" : "var(--text-meta)",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            handleSave();
          }
        }}
        placeholder="프로젝트 메모를 자유롭게 작성하세요..."
        className="flex-1 outline-none resize-none p-4"
        style={{
          fontSize: 13,
          color: "var(--text-primary)",
          backgroundColor: "transparent",
          fontFamily: "inherit",
          lineHeight: 1.7,
          minHeight: 320,
        }}
      />

      <p
        className="px-4 py-2"
        style={{
          fontSize: 10,
          color: "var(--text-meta)",
          borderTop: "0.5px solid var(--border-soft)",
        }}
      >
        💡 입력칸 밖을 클릭하거나 Ctrl+S로 저장됩니다
      </p>
    </div>
  );
}
