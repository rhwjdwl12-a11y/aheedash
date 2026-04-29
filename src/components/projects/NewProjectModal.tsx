"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProject } from "@/app/actions/projects";
import MemberPicker from "@/components/shared/MemberPicker";
import type { Client, Profile } from "@/types/database";

interface NewProjectModalProps {
  clients: Client[];
  profiles?: Profile[];
  currentUserId?: string;
  onClose: () => void;
}

const TYPES = ["제안서", "기획안", "결과보고서", "기타"] as const;
const DURATIONS = ["단기", "중기", "장기"] as const;

export default function NewProjectModal({ clients, profiles = [], currentUserId = "", onClose }: NewProjectModalProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    client_id: "",
    type: "",
    duration_type: "",
    start_date: "",
    deadline: "",
    budget: "",
    description: "",
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("프로젝트 제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    const result = await createProject({
      title: form.title,
      client_id: form.client_id || undefined,
      type: form.type || undefined,
      duration_type: form.duration_type || undefined,
      start_date: form.start_date || undefined,
      deadline: form.deadline || undefined,
      budget: form.budget ? parseInt(form.budget.replace(/,/g, "")) : undefined,
      description: form.description || undefined,
      member_ids: memberIds,
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      onClose();
      if (result?.id) router.push(`/projects/${result.id}`);
    }
    setSaving(false);
  }

  function formatBudget(v: string) {
    const num = v.replace(/[^0-9]/g, "");
    return num ? parseInt(num).toLocaleString("ko-KR") : "";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(61,47,32,0.25)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl flex flex-col"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          boxShadow: "0 8px 32px rgba(61,47,32,0.12)",
        }}
      >
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            새 프로젝트
          </h3>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* 제목 */}
          <Field label="프로젝트 제목 *">
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="프로젝트 이름"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
            />
          </Field>

          {/* 담당업체 */}
          <Field label="담당업체">
            <select
              value={form.client_id}
              onChange={(e) => set("client_id", e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
            >
              <option value="">선택 안 함</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {/* 유형 + 기간유형 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="유형">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
              >
                <option value="">선택</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="기간유형">
              <select
                value={form.duration_type}
                onChange={(e) => set("duration_type", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
              >
                <option value="">선택</option>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
              />
            </Field>
            <Field label="마감일">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
              />
            </Field>
          </div>

          {/* 견적 */}
          <Field label="견적 금액 (원)">
            <input
              type="text"
              value={form.budget}
              onChange={(e) => set("budget", formatBudget(e.target.value))}
              placeholder="1,500,000"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
            />
          </Field>

          {/* 공유 담당자 */}
          <Field label="공유 담당자 (가입된 사용자)">
            <MemberPicker
              profiles={profiles}
              selectedIds={memberIds}
              onChange={setMemberIds}
              ownerId={currentUserId}
              placeholder="담당자 선택 (선택사항)"
            />
          </Field>

          {/* 설명 */}
          <Field label="설명">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="프로젝트 설명..."
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
              style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
          </Field>
        </div>

        <div
          className="flex gap-2 px-5 py-3 shrink-0"
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
            disabled={saving || !form.title.trim()}
            className="flex-1 rounded-md py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ fontSize: 11, color: "var(--text-meta)", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
